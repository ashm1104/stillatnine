// Resubscribe ("Light it again") — the inverse of /api/unsubscribe.
//
// POSTed from the /unsubscribed page with the same signed token. Verifies it,
// clears unsubscribed, and returns JSON so the page can flip to its "welcome
// back" state without a full navigation.

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { verifyToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const token = (body as { token?: unknown })?.token;
  const userId = verifyToken(typeof token === "string" ? token : null);
  if (!userId) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ unsubscribed: false })
    .eq("id", userId);

  if (error) {
    console.error("[resubscribe] update failed:", error);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
