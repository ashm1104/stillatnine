// Resend (Svix) webhook handler.
//
// Runs on Vercel (Node runtime). Resend signs webhooks with Svix: headers
// svix-id / svix-timestamp / svix-signature, HMAC-SHA256 over
// `${id}.${timestamp}.${rawBody}` keyed by the base64 secret after "whsec_".
// We verify manually (no svix dependency), then:
//   - email.bounced    -> flag the recipient bounced  (stop delivering)
//   - email.complained -> flag the recipient complained (stop delivering)
//   - email.opened     -> stamp delivery_history.opened_at (best-effort)
//
// The bounce/complaint half is the automated "email-typo safety net" from
// DECISIONS.md: dead or hostile addresses are dropped from the send list.

import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reject signatures older than this to blunt replay (Svix's recommended window).
const TOLERANCE_SECONDS = 5 * 60;

/** Verify a Svix signature over the raw body. */
function verifySignature(raw: string, headers: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing env var RESEND_WEBHOOK_SECRET");

  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signature = headers.get("svix-signature");
  if (!id || !timestamp || !signature) return false;

  // Timestamp freshness (defends against replay of an old, valid payload).
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) {
    return false;
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${raw}`)
    .digest("base64");

  // The header is a space-separated list of `version,signature` pairs.
  const expectedBuf = Buffer.from(expected);
  return signature.split(" ").some((part) => {
    const sig = part.split(",")[1];
    if (!sig) return false;
    const buf = Buffer.from(sig);
    return buf.length === expectedBuf.length && timingSafeEqual(buf, expectedBuf);
  });
}

type ResendEvent = {
  type: string;
  data?: {
    email_id?: string;
    to?: string | string[];
  };
};

export async function POST(req: NextRequest) {
  const raw = await req.text();

  let valid: boolean;
  try {
    valid = verifySignature(raw, req.headers);
  } catch (err) {
    console.error("[resend webhook] verification error:", err);
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "email.bounced":
        await flagRecipients(event, "bounced");
        break;
      case "email.complained":
        await flagRecipients(event, "complained");
        break;
      case "email.opened":
        await stampOpened(event);
        break;
      default:
        // Acknowledge everything else (delivered, sent, …) so Resend stops.
        break;
    }
  } catch (err) {
    // Transient DB error -> 500 so Resend retries (all writes are idempotent).
    console.error(`[resend webhook] handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/** Set bounced/complained on the recipient(s) so delivery skips them. */
async function flagRecipients(event: ResendEvent, column: "bounced" | "complained") {
  const to = event.data?.to;
  const emails = (Array.isArray(to) ? to : to ? [to] : [])
    .map((e) => e.trim())
    .filter(Boolean);
  if (emails.length === 0) {
    console.warn(`[resend webhook] ${event.type} had no recipient`);
    return;
  }

  const patch = column === "bounced" ? { bounced: true } : { complained: true };
  const supabase = createAdminClient();
  const { error } = await supabase.from("users").update(patch).in("email", emails);
  if (error) throw error;
}

/** Best-effort open tracking: stamp the matching delivery row's opened_at. */
async function stampOpened(event: ResendEvent) {
  const emailId = event.data?.email_id;
  if (!emailId) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("delivery_history")
    .update({ opened_at: new Date().toISOString() })
    .eq("resend_id", emailId)
    .is("opened_at", null); // keep the first open; ignore repeats
  if (error) throw error;
}
