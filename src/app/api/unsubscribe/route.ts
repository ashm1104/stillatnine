// Unsubscribe via signed link (no login — the token is the credential).
//
// Story and welcome emails link here as /api/unsubscribe?token=<userId>.<sig>.
// We verify the token, set unsubscribed = true, and redirect to /unsubscribed
// (carrying the token so the reader can re-light the lamp from there).
//
// A bad/missing token still lands on /unsubscribed rather than showing a raw
// error — but flips nothing, so a scanner that pings a malformed link is inert.

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { verifyToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://stillatnine.com"
).replace(/\/$/, "");

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const userId = verifyToken(token);

  if (userId) {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("users")
      .update({ unsubscribed: true })
      .eq("id", userId);
    if (error) {
      console.error("[unsubscribe] update failed:", error);
      // Fall through to /unsubscribed anyway — surfacing a 500 to a reader who
      // clicked "unsubscribe" is worse than an optimistic confirmation; the
      // bounce/complaint safety net and a retry both still apply.
    }
  } else {
    console.warn("[unsubscribe] invalid or missing token");
  }

  // Keep the (verified) token on the confirmation URL so "Light it again" works.
  const dest = new URL("/unsubscribed", SITE_URL);
  if (userId && token) dest.searchParams.set("token", token);
  return NextResponse.redirect(dest, { status: 302 });
}
