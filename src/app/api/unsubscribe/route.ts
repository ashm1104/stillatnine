// Unsubscribe via signed link (no login — the token is the credential).
//
// Story and welcome emails link here as /api/unsubscribe?token=<userId>.<sig>.
// We verify the token, set unsubscribed = true, and redirect to /unsubscribed
// (carrying the token so the reader can re-light the lamp from there).
//
// Two entry points share one flip:
//   - GET  — the *visible* "Unsubscribe" link a reader clicks (→ redirect).
//   - POST — RFC 8058 one-click, triggered by Gmail/Apple Mail's built-in
//            "Unsubscribe" button via the List-Unsubscribe-Post header (→ 200).
//
// A bad/missing token still lands on /unsubscribed (GET) or returns 200 (POST)
// rather than showing a raw error — but flips nothing, so a scanner that pings
// a malformed link is inert.

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { verifyAnyToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://stillatnine.com"
).replace(/\/$/, "");

/**
 * Verify the token and unsubscribe whichever audience it belongs to:
 *   - buyer (users)        → unsubscribed = true
 *   - subscriber (funnel)  → status = 'unsubscribed' (drops out of the cron)
 * Returns the verified token's owner so the caller can keep it on the URL.
 */
async function unsubscribe(token: string | null): Promise<string | null> {
  const who = verifyAnyToken(token);
  if (!who) {
    console.warn("[unsubscribe] invalid or missing token");
    return null;
  }

  const supabase = createAdminClient();
  const { error } =
    who.kind === "user"
      ? await supabase.from("users").update({ unsubscribed: true }).eq("id", who.id)
      : await supabase.from("subscribers").update({ status: "unsubscribed" }).eq("id", who.id);
  if (error) {
    // Don't surface a 500 to a reader who clicked "unsubscribe" — the
    // bounce/complaint safety net and a retry both still apply.
    console.error("[unsubscribe] update failed:", error);
  }
  return who.id;
}

// Visible link in the email body — flip, then confirm on /unsubscribed.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const id = await unsubscribe(token);

  // Keep the (verified) token on the confirmation URL so "Light it again" works.
  const dest = new URL("/unsubscribed", SITE_URL);
  if (id && token) dest.searchParams.set("token", token);
  return NextResponse.redirect(dest, { status: 302 });
}

// RFC 8058 one-click — the mail client POSTs in the background and only wants a
// 2xx. No redirect, no body needed. Token rides the query string (same URL as
// List-Unsubscribe), so we don't depend on parsing the form body.
export async function POST(req: NextRequest) {
  await unsubscribe(req.nextUrl.searchParams.get("token"));
  return new NextResponse(null, { status: 200 });
}
