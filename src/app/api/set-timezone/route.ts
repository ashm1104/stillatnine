// Save the buyer's timezone, captured on /welcome after payment.
//
// Identified by dodo_payment_id (the only thing we know about the buyer client-
// side — see lib/dodo). The webhook may not have created the row yet, so when
// no row matches we return 202 and the page retries.

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidTimeZone(tz: string): boolean {
  try {
    // Throws RangeError for an unknown IANA zone.
    Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * The reader's three delivery nights. The schedule is anchored to the purchase
 * weekday (story 1), then the 2-2-3 day pattern lands on weekday, +2, +4 — a
 * fixed trio. See DECISIONS.md (Phase 4 delivery schedule).
 */
function deliveryNights(purchasedAtIso: string | null, tz: string): string[] {
  if (!purchasedAtIso) return [];
  const name = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(
    new Date(purchasedAtIso),
  );
  const i = WEEKDAYS.indexOf(name);
  if (i < 0) return [];
  return [i, (i + 2) % 7, (i + 4) % 7].map((k) => WEEKDAYS[k]);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { paymentId, timezone } = (body ?? {}) as {
    paymentId?: unknown;
    timezone?: unknown;
  };

  const id = typeof paymentId === "string" ? paymentId.trim() : "";
  const tz = typeof timezone === "string" ? timezone.trim() : "";

  if (!id) {
    return NextResponse.json({ error: "missing paymentId" }, { status: 400 });
  }
  if (!tz || !isValidTimeZone(tz)) {
    return NextResponse.json({ error: "invalid timezone" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .update({ timezone: tz })
    .eq("dodo_payment_id", id)
    .select("currency, email, purchased_at");

  if (error) {
    console.error("[set-timezone] update failed:", error);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }

  // No row yet => the webhook hasn't created the user. Ask the client to retry.
  const row = data?.[0];
  if (!row) {
    return NextResponse.json({ ok: false, found: false }, { status: 202 });
  }

  // Return the order so /welcome can show the paid currency, confirm the
  // delivery email (typo safety net), and tell the reader their three nights —
  // all sourced from the DB, not the URL.
  return NextResponse.json(
    {
      ok: true,
      found: true,
      currency: row.currency,
      email: row.email,
      nights: deliveryNights(row.purchased_at, tz),
    },
    { status: 200 },
  );
}
