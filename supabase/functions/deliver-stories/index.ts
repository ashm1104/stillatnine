// Still at Nine — story delivery scheduler.
//
// Runs on Supabase Edge Functions (Deno), triggered by cron-job.org every
// 15 min. Per-user, purchase-anchored schedule (see DECISIONS.md):
//   - Story 1: 9 PM local on purchase night (immediate if bought after 9 PM).
//   - Stories 2-24: 9 PM local on a 2-2-3 day gap pattern from the purchase date.
//
// At most ONE story per user per run, in their local 9 PM evening window.
// Email HTML is assembled by ./render.ts. Auth: Bearer CRON_SECRET.

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { buildEmail, type Story, TOTAL_STORIES } from "./render.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const TOKEN_SECRET = Deno.env.get("UNSUBSCRIBE_TOKEN_SECRET")!;
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://stillatnine.com").replace(/\/$/, "");
const FROM = "Still at Nine <stories@stillatnine.com>";
const REPLY_TO = "hello@stillatnine.com";
const MAX_FAILURES = 3;

// ---------------------------------------------------------------------------
// Schedule math
// ---------------------------------------------------------------------------

/** Day offset from the purchase date for story `n` (1-based): 2-2-3 pattern. */
function dayOffset(n: number): number {
  const i = n - 1;
  return Math.floor(i / 3) * 7 + [0, 2, 4][i % 3];
}

/** Local wall-clock parts of an instant in a given IANA timezone. */
function localParts(d: Date, tz: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
      weekday: "long",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return {
    dateStr: `${p.year}-${p.month}-${p.day}`, // YYYY-MM-DD (lexical-comparable)
    hour: Number(p.hour) % 24,
    weekday: p.weekday as string,
  };
}

/** Add `days` to a YYYY-MM-DD string (noon-UTC anchor avoids DST edges). */
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

type User = {
  id: string;
  email: string;
  timezone: string;
  purchased_at: string;
  current_story: number | null;
};

/** Decide whether the user's next story is due to send right now. */
function isDue(user: User, now: Date): { due: boolean; storyNo: number; weekday: string } {
  const storyNo = (user.current_story ?? 0) + 1;
  const nowL = localParts(now, user.timezone);
  const purchaseL = localParts(new Date(user.purchased_at), user.timezone);

  if (storyNo === 1) {
    // Bought after 9 PM local → send immediately (any hour, next run).
    if (purchaseL.hour >= 21) return { due: true, storyNo, weekday: nowL.weekday };
    // Bought before 9 PM → due at 9 PM on the purchase date.
    const due = nowL.dateStr >= purchaseL.dateStr && nowL.hour >= 21;
    return { due, storyNo, weekday: nowL.weekday };
  }

  // Stories 2-24: due at 9 PM local on (purchase date + offset). The evening
  // gate (hour >= 21) keeps sends after dark and lets a missed slot catch up
  // the next evening rather than firing at an odd hour.
  const dueDate = addDays(purchaseL.dateStr, dayOffset(storyNo));
  const due = nowL.dateStr >= dueDate && nowL.hour >= 21;
  return { due, storyNo, weekday: nowL.weekday };
}

// ---------------------------------------------------------------------------
// Signed management tokens
// ---------------------------------------------------------------------------

/**
 * `<userId>.<sig>` token for unsubscribe links — the no-login credential.
 * Mirrors src/lib/token.ts on the Vercel side (base64url HMAC-SHA256, no
 * padding); the two MUST stay in sync so /api/unsubscribe can verify these.
 */
async function unsubscribeToken(userId: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(TOKEN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(userId));
  let bin = "";
  for (const b of new Uint8Array(mac)) bin += String.fromCharCode(b);
  const b64url = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${userId}.${b64url}`;
}

// ---------------------------------------------------------------------------
// Sending + logging
// ---------------------------------------------------------------------------

async function sendStory(supabase: SupabaseClient, user: User, story: Story, weekday: string) {
  const dateLabel = `${weekday}, 9:00 PM`;
  const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${await unsubscribeToken(user.id)}`;
  const html = buildEmail(story, dateLabel, unsubUrl);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: user.email,
      reply_to: REPLY_TO,
      subject: story.subject_line ?? story.title,
      html,
    }),
  });

  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    await supabase.from("delivery_history").insert({
      user_id: user.id,
      story_number: story.story_number,
      resend_id: data.id ?? null,
      status: "sent",
    });
    await supabase.from("users").update({ current_story: story.story_number }).eq("id", user.id);
    return { ok: true };
  }

  // Failure: accrue failure_count on this (user, story); abandon at 3 and skip
  // the story so the sequence isn't stuck forever.
  const errText = await res.text().catch(() => "");
  const { data: prior } = await supabase
    .from("delivery_history")
    .select("id, failure_count")
    .eq("user_id", user.id)
    .eq("story_number", story.story_number)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const failures = (prior?.failure_count ?? 0) + 1;
  const abandoned = failures >= MAX_FAILURES;
  const status = abandoned ? "abandoned" : "failed";

  if (prior?.id) {
    await supabase.from("delivery_history").update({ failure_count: failures, status }).eq("id", prior.id);
  } else {
    await supabase.from("delivery_history").insert({
      user_id: user.id, story_number: story.story_number, status, failure_count: failures,
    });
  }
  if (abandoned) {
    await supabase.from("users").update({ current_story: story.story_number }).eq("id", user.id);
  }
  console.error(`[deliver] send failed user ${user.id} story ${story.story_number}: ${errText}`);
  return { ok: false, abandoned };
}

/** True if the user already received a story earlier today (their local date). */
async function sentToday(supabase: SupabaseClient, user: User, now: Date): Promise<boolean> {
  const { data } = await supabase
    .from("delivery_history")
    .select("sent_at")
    .eq("user_id", user.id)
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.sent_at) return false;
  return localParts(new Date(data.sent_at), user.timezone).dateStr === localParts(now, user.timezone).dateStr;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const now = new Date();

  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, timezone, purchased_at, current_story")
    .eq("refunded", false)
    .eq("unsubscribed", false)
    .eq("bounced", false)
    .eq("complained", false)
    .not("timezone", "is", null)
    .lt("current_story", TOTAL_STORIES);

  if (error) {
    console.error("[deliver] user query failed:", error);
    return new Response(JSON.stringify({ error: "query failed" }), { status: 500 });
  }

  let sent = 0, failed = 0, skipped = 0;

  for (const user of (users ?? []) as User[]) {
    try {
      const { due, storyNo, weekday } = isDue(user, now);
      if (!due) { skipped++; continue; }
      if (await sentToday(supabase, user, now)) { skipped++; continue; } // ≤1/day

      const { data: story } = await supabase
        .from("stories")
        .select("story_number, title, category, read_minutes, content_blocks, sources, disclaimer, subject_line, preheader")
        .eq("story_number", storyNo)
        .in("status", ["ready", "live"])
        .maybeSingle();

      if (!story) { skipped++; continue; } // story not ready yet — try next run

      const r = await sendStory(supabase, user, story as Story, weekday);
      r.ok ? sent++ : failed++;
    } catch (e) {
      failed++;
      console.error(`[deliver] user ${user.id} errored:`, e);
    }
  }

  const summary = { sent, failed, skipped, considered: users?.length ?? 0 };
  console.log("[deliver]", JSON.stringify(summary));
  return new Response(JSON.stringify(summary), { headers: { "Content-Type": "application/json" } });
});
