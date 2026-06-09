// Dodo Payments webhook handler.
//
// Runs on Vercel (Node runtime). Verifies the Standard Webhooks signature with
// the official Dodo SDK, then:
//   - payment.succeeded -> upsert the buyer into Supabase + send welcome email
//   - refund.succeeded   -> mark the buyer refunded
//
// Idempotent on dodo_payment_id: a duplicate webhook re-runs the upsert but
// inserts no row, so the welcome email is sent exactly once.

import { NextResponse, type NextRequest } from "next/server";
import DodoPayments from "dodopayments";
import type {
  Payment,
  // (Refund type lives under refunds; we only touch payment_id, typed inline.)
} from "dodopayments/resources/payments";

import { createAdminClient } from "@/lib/supabase";
import { getResend, RESEND_FROM, RESEND_REPLY_TO } from "@/lib/resend";
import { renderWelcomeEmail, WELCOME_SUBJECT } from "@/lib/welcome-email";
import { createToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://stillatnine.com"
).replace(/\/$/, "");

function dodoClient(): DodoPayments {
  const webhookKey = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookKey) {
    throw new Error("Missing env var DODO_WEBHOOK_SECRET");
  }
  // bearerToken isn't needed to verify webhooks, but the SDK expects one.
  return new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY ?? "unused",
    webhookKey,
  });
}

export async function POST(req: NextRequest) {
  // Signature is computed over the RAW body — read text, never parse first.
  const raw = await req.text();
  const headers = {
    "webhook-id": req.headers.get("webhook-id") ?? "",
    "webhook-signature": req.headers.get("webhook-signature") ?? "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
  };

  let event;
  try {
    event = dodoClient().webhooks.unwrap(raw, { headers });
  } catch (err) {
    console.error("[dodo webhook] signature verification failed:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  try {
    switch (event.type) {
      case "payment.succeeded":
        await handlePaymentSucceeded(event.data);
        break;
      case "refund.succeeded":
        await handleRefund(event.data.payment_id);
        break;
      default:
        // Acknowledge every other event so Dodo doesn't keep retrying.
        break;
    }
  } catch (err) {
    // A thrown error here is a transient DB failure — 500 tells Dodo to retry,
    // which is safe because the writes are idempotent.
    console.error(`[dodo webhook] handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(payment: Payment) {
  const email = payment.customer?.email;
  const paymentId = payment.payment_id;
  if (!email || !paymentId) {
    console.error("[dodo webhook] payment.succeeded missing email/payment_id", {
      paymentId,
      hasEmail: !!email,
    });
    return; // nothing actionable; ack so Dodo stops retrying
  }

  const supabase = createAdminClient();

  // Idempotent on dodo_payment_id. ignoreDuplicates => a duplicate webhook
  // returns zero rows, so we only send the welcome email on first creation.
  const { data: inserted, error } = await supabase
    .from("users")
    .upsert(
      {
        email,
        dodo_payment_id: paymentId,
        currency: (payment.currency || "USD").toUpperCase(),
        amount_paid: payment.total_amount ?? 0,
        current_story: 0,
      },
      { onConflict: "dodo_payment_id", ignoreDuplicates: true },
    )
    .select("id");

  if (error) {
    // 23505 = unique_violation: the same email already bought (email is UNIQUE),
    // or a race re-inserted the same payment. Treat as already-processed.
    if (error.code === "23505") {
      console.log(
        `[dodo webhook] user already exists for ${paymentId} — skipping`,
      );
      return;
    }
    throw error; // transient -> let Dodo retry
  }

  const isNewUser = !!inserted && inserted.length > 0;
  if (!isNewUser) {
    console.log(
      `[dodo webhook] duplicate payment.succeeded ${paymentId} — no email`,
    );
    return;
  }

  await sendWelcomeEmail(email, inserted![0].id);
}

async function sendWelcomeEmail(email: string, userId: string) {
  const html = renderWelcomeEmail({
    // No /manage page yet — point at the welcome receipt for now.
    manageUrl: `${SITE_URL}/welcome`,
    // Signed token, not a raw id — see lib/token.
    unsubscribeUrl: `${SITE_URL}/api/unsubscribe?token=${createToken(userId)}`,
  });

  try {
    const { error } = await getResend().emails.send({
      from: RESEND_FROM,
      to: email,
      replyTo: RESEND_REPLY_TO,
      subject: WELCOME_SUBJECT,
      html,
    });
    if (error) {
      // The user record is already saved — don't fail the webhook over email.
      console.error("[dodo webhook] welcome email failed:", error);
    }
  } catch (err) {
    console.error("[dodo webhook] welcome email threw:", err);
  }
}

async function handleRefund(paymentId: string | undefined) {
  if (!paymentId) return;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ refunded: true })
    .eq("dodo_payment_id", paymentId);
  if (error) throw error;
}
