// Funnel email capture — the primary CTA on the preview modals (and, later,
// the public story pages). Creates a `subscribers` row and schedules the first
// free story for 9 PM subscriber-local (or immediately for a late signup).
//
// No verification step (the doc's funnel is friction-light): we capture, we
// schedule, the 9 PM story IS the confirmation. Bounce/complaint flags (Resend
// webhook) and the reply-to-a-person safety net cover bad addresses.
//
// Returns a `state` the modal maps to on-brand confirmation copy.

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { initialSchedule } from "@/lib/funnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export type SubscribeState =
  | "just_in_time" // late signup: story #1 goes out within minutes
  | "queued" // story #1 queued for 9 PM local tonight
  | "resubscribed" // a previously-unsubscribed reader re-entered
  | "already_pending" // already in the sequence — idempotent re-submit
  | "already_customer"; // already bought the collection

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { email, timezone, source } = (body ?? {}) as {
    email?: unknown;
    timezone?: unknown;
    source?: unknown;
  };

  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(cleanEmail)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  // Timezone is the browser's Intl zone; fall back to UTC so we never strand a
  // capture (the 9 PM ritual just lands at 9 PM UTC for that rare case).
  const rawTz = typeof timezone === "string" ? timezone.trim() : "";
  const tz = rawTz && isValidTimeZone(rawTz) ? rawTz : "Etc/UTC";
  const signupSource = typeof source === "string" ? source.trim().slice(0, 80) || null : null;

  // Geo currency from Vercel's edge header (mirrors landing-page pricing) so the
  // funnel emails name the right price. India -> INR, everywhere else -> USD.
  const country = (req.headers.get("x-vercel-ip-country") || "").toUpperCase();
  const currency = country === "IN" ? "INR" : "USD";

  const supabase = createAdminClient();

  // Already a buyer? They're past the funnel — don't re-capture.
  const { data: buyer } = await supabase
    .from("users")
    .select("id")
    .eq("email", cleanEmail)
    .eq("refunded", false)
    .maybeSingle();
  if (buyer) {
    return NextResponse.json({ ok: true, state: "already_customer" satisfies SubscribeState });
  }

  const now = new Date();
  const { nextSendAt, immediate } = initialSchedule(now, tz);

  // Existing subscriber? Don't reset progress — except re-light an unsubscribe.
  const { data: existing } = await supabase
    .from("subscribers")
    .select("id, status")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (existing) {
    if (existing.status === "unsubscribed") {
      await supabase
        .from("subscribers")
        .update({
          status: "free_sequence",
          funnel_step: 0,
          timezone: tz,
          currency,
          signup_source: signupSource,
          next_send_at: nextSendAt.toISOString(),
        })
        .eq("id", existing.id);
      return NextResponse.json({
        ok: true,
        state: (immediate ? "just_in_time" : "resubscribed") satisfies SubscribeState,
      });
    }
    // Mid-sequence / dormant / purchased: idempotent, leave their schedule alone.
    return NextResponse.json({ ok: true, state: "already_pending" satisfies SubscribeState });
  }

  const { error } = await supabase.from("subscribers").insert({
    email: cleanEmail,
    timezone: tz,
    currency,
    status: "free_sequence",
    funnel_step: 0,
    next_send_at: nextSendAt.toISOString(),
    signup_source: signupSource,
  });

  if (error) {
    // 23505 = a race inserted the same email between our check and insert.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, state: "already_pending" satisfies SubscribeState });
    }
    console.error("[subscribe] insert failed:", error);
    return NextResponse.json({ error: "insert failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    state: (immediate ? "just_in_time" : "queued") satisfies SubscribeState,
  });
}
