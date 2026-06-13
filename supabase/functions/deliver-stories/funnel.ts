// Funnel free-sequence processor (launch-reference.md Part 1), run inside the
// existing deliver-stories Edge Function on every 15-min cron tick — AFTER the
// buyer loop. Buyers live in `users`; funnel subscribers live in `subscribers`
// and convert to buyers via the Dodo webhook (matched by email).
//
// Per subscriber, when next_send_at is due (9 PM subscriber-local, set by the
// scheduler), advance one step:
//   step 0 -> free story #1 (soft footer)   then +3 nights
//   step 1 -> free story #2 (firm footer)    then +2 nights, status='pitched'
//   step 2 -> THE PITCH (no story)           then +5 weeks,  status='dormant'
//   step 3 -> occasional free story          then +5 weeks   (repeats)
//
// Mirrors src/lib/funnel.ts (scheduling math) and src/lib/token.ts
// (createSubscriberToken) — keep them in sync.

import { type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import {
  buildEmail,
  buildPitchEmail,
  type Footer,
  priceFor,
  type Story,
  TOTAL_STORIES,
} from "./render.ts";

const DELIVERY_HOUR = 21; // 9 PM local
const STORY2_GAP_DAYS = 3;
const PITCH_GAP_DAYS = 2;
const OCCASIONAL_GAP_DAYS = 35;
const MAX_FAILURES = 3;

const STORY_COLS =
  "story_number, title, category, read_minutes, content_blocks, sources, disclaimer, subject_line, preheader, sequence_position";

export type FunnelConfig = {
  resendKey: string;
  tokenSecret: string;
  siteUrl: string;
  from: string;
  replyTo: string;
};

type Subscriber = {
  id: string;
  email: string;
  timezone: string;
  currency: string;
  status: string;
  funnel_step: number;
};

// ---------------------------------------------------------------------------
// Time helpers (mirror src/lib/funnel.ts)
// ---------------------------------------------------------------------------

function localParts(d: Date, tz: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false, weekday: "long",
    }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  return {
    dateStr: `${p.year}-${p.month}-${p.day}`,
    hour: Number(p.hour) % 24,
    weekday: p.weekday as string,
  };
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function localWallToUtc(dateStr: string, hour: number, tz: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const targetWall = Date.UTC(y, m - 1, d, hour, 0, 0);
  let ts = targetWall;
  for (let i = 0; i < 2; i++) {
    const lp = localParts(new Date(ts), tz);
    const [ly, lm, ld] = lp.dateStr.split("-").map(Number);
    const haveWall = Date.UTC(ly, lm - 1, ld, lp.hour, 0);
    ts += targetWall - haveWall;
  }
  return new Date(ts);
}

/** next_send_at for `gapDays` nights from now, at 9 PM subscriber-local. */
function nextNineAfter(now: Date, tz: string, gapDays: number): string {
  const today = localParts(now, tz).dateStr;
  return localWallToUtc(addDays(today, gapDays), DELIVERY_HOUR, tz).toISOString();
}

// ---------------------------------------------------------------------------
// Subscriber unsubscribe token — `sub.<id>.<sig>` (mirrors createSubscriberToken)
// ---------------------------------------------------------------------------

async function subscriberToken(id: string, secret: string): Promise<string> {
  const payload = `sub.${id}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  let bin = "";
  for (const b of new Uint8Array(mac)) bin += String.fromCharCode(b);
  const sig = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${payload}.${sig}`;
}

// ---------------------------------------------------------------------------
// Content selection
// ---------------------------------------------------------------------------

/** Story numbers this subscriber has already been sent (successfully). */
async function receivedNumbers(supabase: SupabaseClient, subId: string): Promise<Set<number>> {
  const { data } = await supabase
    .from("story_sends")
    .select("story_number")
    .eq("subscriber_id", subId)
    .eq("status", "sent")
    .not("story_number", "is", null);
  return new Set((data ?? []).map((r: { story_number: number }) => r.story_number));
}

/** First eligible story in the given pools not yet received, by sequence. */
async function pickStory(
  supabase: SupabaseClient,
  pools: string[],
  received: Set<number>,
): Promise<Story | null> {
  const { data } = await supabase
    .from("stories")
    .select(STORY_COLS)
    .in("pool", pools)
    .in("status", ["ready", "live"])
    .order("sequence_position", { ascending: true, nullsFirst: false })
    .order("story_number", { ascending: true });
  for (const s of (data ?? []) as Story[]) {
    if (!received.has(s.story_number)) return s;
  }
  return null;
}

/** A few locked-story hooks (titles) to name in the firm footer / pitch. */
async function lockedHooks(
  supabase: SupabaseClient,
  received: Set<number>,
  limit: number,
): Promise<string[]> {
  const { data } = await supabase
    .from("stories")
    .select("story_number, title, sequence_position")
    .in("pool", ["A", "B"])
    .in("status", ["ready", "live"])
    .order("sequence_position", { ascending: true, nullsFirst: false })
    .order("story_number", { ascending: true });
  const out: string[] = [];
  for (const s of (data ?? []) as { story_number: number; title: string }[]) {
    if (!received.has(s.story_number)) out.push(s.title);
    if (out.length >= limit) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Send + retry bookkeeping (mirrors the buyer path)
// ---------------------------------------------------------------------------

type SendOutcome = { ok: boolean; abandoned: boolean };

async function sendFunnelEmail(
  supabase: SupabaseClient,
  cfg: FunnelConfig,
  sub: Subscriber,
  args: { type: "free" | "occasional" | "pitch"; storyNumber: number | null; subject: string; html: string },
): Promise<SendOutcome> {
  const unsubUrl = `${cfg.siteUrl}/api/unsubscribe?token=${await subscriberToken(sub.id, cfg.tokenSecret)}`;
  // The token is baked into html already; unsubUrl here is only for the header.
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: cfg.from,
      to: sub.email,
      reply_to: cfg.replyTo,
      subject: args.subject,
      html: args.html,
      headers: {
        "List-Unsubscribe": `<${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });

  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    await supabase.from("story_sends").insert({
      subscriber_id: sub.id,
      story_number: args.storyNumber,
      type: args.type,
      resend_id: data.id ?? null,
      status: "sent",
    });
    return { ok: true, abandoned: false };
  }

  // Failure: accrue failure_count on this (subscriber, type, story) attempt row.
  const errText = await res.text().catch(() => "");
  let q = supabase
    .from("story_sends")
    .select("id, failure_count")
    .eq("subscriber_id", sub.id)
    .eq("type", args.type)
    .neq("status", "sent");
  q = args.storyNumber === null ? q.is("story_number", null) : q.eq("story_number", args.storyNumber);
  const { data: prior } = await q.order("sent_at", { ascending: false }).limit(1).maybeSingle();

  const failures = (prior?.failure_count ?? 0) + 1;
  const abandoned = failures >= MAX_FAILURES;
  const status = abandoned ? "abandoned" : "failed";
  if (prior?.id) {
    await supabase.from("story_sends").update({ failure_count: failures, status }).eq("id", prior.id);
  } else {
    await supabase.from("story_sends").insert({
      subscriber_id: sub.id, story_number: args.storyNumber, type: args.type, status, failure_count: failures,
    });
  }
  console.error(`[funnel] send failed sub ${sub.id} step ${sub.funnel_step}: ${errText}`);
  return { ok: false, abandoned };
}

// ---------------------------------------------------------------------------
// Per-subscriber step machine
// ---------------------------------------------------------------------------

async function advance(
  supabase: SupabaseClient,
  sub: Subscriber,
  patch: { funnel_step?: number; status?: string; next_send_at: string | null },
) {
  await supabase.from("subscribers").update(patch).eq("id", sub.id);
}

async function processOne(
  supabase: SupabaseClient,
  cfg: FunnelConfig,
  sub: Subscriber,
  now: Date,
): Promise<"sent" | "skipped" | "failed" | "purchased"> {
  // Race guard: re-check purchase at send time. A buyer (matched by email,
  // not refunded) exits the sequence instantly.
  const { data: buyer } = await supabase
    .from("users")
    .select("id")
    .eq("email", sub.email)
    .eq("refunded", false)
    .maybeSingle();
  if (buyer) {
    await advance(supabase, sub, { status: "purchased", next_send_at: null });
    return "purchased";
  }

  const received = await receivedNumbers(supabase, sub.id);
  const { price, anchor } = priceFor(sub.currency);
  const weekday = localParts(now, sub.timezone).weekday;
  const dateLabel = `${weekday}, 9:00 PM`;
  const unsubToken = await subscriberToken(sub.id, cfg.tokenSecret);
  const unsubUrl = `${cfg.siteUrl}/api/unsubscribe?token=${unsubToken}`;

  switch (sub.funnel_step) {
    case 0: {
      const story = await pickStory(supabase, ["B"], received);
      if (!story) { // no free story assigned yet — retry tomorrow, don't hammer
        await advance(supabase, sub, { next_send_at: nextNineAfter(now, sub.timezone, 1) });
        return "skipped";
      }
      const buyUrl = `${cfg.siteUrl}/?src=free1`;
      const footer: Footer = { kind: "free_soft", price, buyUrl };
      const html = buildEmail(story, dateLabel, unsubUrl, footer);
      const r = await sendFunnelEmail(supabase, cfg, sub, {
        type: "free", storyNumber: story.story_number, subject: story.subject_line ?? story.title, html,
      });
      if (r.ok || r.abandoned) {
        await advance(supabase, sub, {
          funnel_step: 1, next_send_at: nextNineAfter(now, sub.timezone, STORY2_GAP_DAYS),
        });
      }
      return r.ok ? "sent" : "failed";
    }
    case 1: {
      const story = await pickStory(supabase, ["B"], received);
      if (!story) { // only one Pool B story assigned — go straight to the pitch
        await advance(supabase, sub, {
          funnel_step: 2, status: "pitched", next_send_at: nextNineAfter(now, sub.timezone, PITCH_GAP_DAYS),
        });
        return "skipped";
      }
      const remaining = TOTAL_STORIES - (received.size + 1);
      const hooks = await lockedHooks(supabase, new Set([...received, story.story_number]), 2);
      const buyUrl = `${cfg.siteUrl}/?src=free2`;
      const footer: Footer = { kind: "free_firm", remaining, buyUrl, hooks };
      const html = buildEmail(story, dateLabel, unsubUrl, footer);
      const r = await sendFunnelEmail(supabase, cfg, sub, {
        type: "free", storyNumber: story.story_number, subject: story.subject_line ?? story.title, html,
      });
      if (r.ok || r.abandoned) {
        await advance(supabase, sub, {
          funnel_step: 2, status: "pitched", next_send_at: nextNineAfter(now, sub.timezone, PITCH_GAP_DAYS),
        });
      }
      return r.ok ? "sent" : "failed";
    }
    case 2: {
      const hooks = await lockedHooks(supabase, received, 4);
      const buyUrl = `${cfg.siteUrl}/?src=pitch`;
      const html = buildPitchEmail({ price, anchor, buyUrl, unsubUrl, hooks });
      const r = await sendFunnelEmail(supabase, cfg, sub, {
        type: "pitch", storyNumber: null, subject: "The First Collection — twenty-four of these.", html,
      });
      if (r.ok || r.abandoned) {
        await advance(supabase, sub, {
          funnel_step: 3, status: "dormant", next_send_at: nextNineAfter(now, sub.timezone, OCCASIONAL_GAP_DAYS),
        });
      }
      return r.ok ? "sent" : "failed";
    }
    default: {
      // step >= 3: dormant occasional. Send the next eligible story; if none is
      // available, just push the next check out (no email).
      const story = await pickStory(supabase, ["B", "C"], received);
      if (!story) {
        await advance(supabase, sub, { next_send_at: nextNineAfter(now, sub.timezone, OCCASIONAL_GAP_DAYS) });
        return "skipped";
      }
      const buyUrl = `${cfg.siteUrl}/?src=occasional`;
      const footer: Footer = { kind: "occasional", price, buyUrl };
      const html = buildEmail(story, dateLabel, unsubUrl, footer);
      const r = await sendFunnelEmail(supabase, cfg, sub, {
        type: "occasional", storyNumber: story.story_number, subject: story.subject_line ?? story.title, html,
      });
      if (r.ok || r.abandoned) {
        await advance(supabase, sub, { next_send_at: nextNineAfter(now, sub.timezone, OCCASIONAL_GAP_DAYS) });
      }
      return r.ok ? "sent" : "failed";
    }
  }
}

// ---------------------------------------------------------------------------
// Entry point — called from index.ts after the buyer loop
// ---------------------------------------------------------------------------

export async function processFunnel(supabase: SupabaseClient, cfg: FunnelConfig, now: Date) {
  const { data: subs, error } = await supabase
    .from("subscribers")
    .select("id, email, timezone, currency, status, funnel_step")
    .in("status", ["free_sequence", "pitched", "dormant"])
    .lte("next_send_at", now.toISOString())
    .not("timezone", "is", null)
    .eq("bounced", false)
    .eq("complained", false);

  if (error) {
    console.error("[funnel] subscriber query failed:", error);
    return { sent: 0, failed: 0, skipped: 0, purchased: 0, considered: 0 };
  }

  let sent = 0, failed = 0, skipped = 0, purchased = 0;
  for (const sub of (subs ?? []) as Subscriber[]) {
    try {
      const r = await processOne(supabase, cfg, sub, now);
      if (r === "sent") sent++;
      else if (r === "failed") failed++;
      else if (r === "purchased") purchased++;
      else skipped++;
    } catch (e) {
      failed++;
      console.error(`[funnel] subscriber ${sub.id} errored:`, e);
    }
  }
  const summary = { sent, failed, skipped, purchased, considered: subs?.length ?? 0 };
  console.log("[funnel]", JSON.stringify(summary));
  return summary;
}
