// Resubscribe ("Light it again") — the inverse of /api/unsubscribe.
//
// POSTed from the /unsubscribed page with the same signed token. Verifies it,
// clears unsubscribed, and returns JSON so the page can flip to its "welcome
// back" state without a full navigation.

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { verifyAnyToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A re-lit subscriber rejoins as a dormant non-converter (occasional emails),
// not back at the top of the free sequence. First occasional lands ~5 weeks out.
const OCCASIONAL_INTERVAL_MS = 35 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const token = (body as { token?: unknown })?.token;
  const who = verifyAnyToken(typeof token === "string" ? token : null);
  if (!who) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } =
    who.kind === "user"
      ? await supabase.from("users").update({ unsubscribed: false }).eq("id", who.id)
      : await supabase
          .from("subscribers")
          .update({
            status: "dormant",
            next_send_at: new Date(Date.now() + OCCASIONAL_INTERVAL_MS).toISOString(),
          })
          .eq("id", who.id);

  if (error) {
    console.error("[resubscribe] update failed:", error);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
