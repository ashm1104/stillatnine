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

  // If this buyer came through the free funnel, graduate them: exit the
  // sequence and carry their already-read free stories into the paid playlist
  // so they're never re-sent (see launch-reference.md — "buyers never receive
  // duplicates"). Best-effort: never block account creation / welcome email.
  await graduateSubscriber(supabase, email, inserted![0].id);

  await sendWelcomeEmail(email, inserted![0].id);
}

/**
 * Carry a converting subscriber's free-story history onto the new buyer record:
 * mark the subscriber `purchased` (exits the funnel) and pre-seed
 * delivery_history with status='free_carryover' rows for each collection story
 * (1..24) they already received. The delivery Edge Function's playlist excludes
 * these, but they DON'T count as a paid slot — so "first story tonight" holds.
 */
async function graduateSubscriber(
  supabase: ReturnType<typeof createAdminClient>,
  email: string,
  userId: string,
) {
  try {
    const { data: sub } = await supabase
      .from("subscribers")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (!sub) return; // direct buyer, never in the funnel

    const { data: sends } = await supabase
      .from("story_sends")
      .select("story_number")
      .eq("subscriber_id", sub.id)
      .eq("status", "sent")
      .not("story_number", "is", null);

    const received = [
      ...new Set(
        (sends ?? [])
          .map((s) => s.story_number)
          .filter((n): n is number => typeof n === "number" && n >= 1 && n <= 24),
      ),
    ];
    if (received.length) {
      await supabase.from("delivery_history").insert(
        received.map((story_number) => ({
          user_id: userId,
          story_number,
          status: "free_carryover",
        })),
      );
    }

    await supabase
      .from("subscribers")
      .update({ status: "purchased", next_send_at: null })
      .eq("id", sub.id);
  } catch (err) {
    console.error("[dodo webhook] subscriber graduation failed:", err);
  }
}

async function sendWelcomeEmail(email: string, userId: string) {
  // Signed token, not a raw id — see lib/token. (No "manage" link: deferred
  // until there's a /manage page — see DECISIONS.md.)
  const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${createToken(userId)}`;
  const html = renderWelcomeEmail({ unsubscribeUrl });

  try {
    const { error } = await getResend().emails.send({
      from: RESEND_FROM,
      to: email,
      replyTo: RESEND_REPLY_TO,
      subject: WELCOME_SUBJECT,
      html,
      // RFC 8058 one-click unsubscribe — surfaces Gmail/Apple Mail's native
      // "Unsubscribe" button and is a direct inbox-placement signal.
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
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
