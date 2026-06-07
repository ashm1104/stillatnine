// Still at Nine — story delivery scheduler.
//
// Runs on Supabase Edge Functions (Deno), triggered by cron-job.org every
// 15 min. Per-user, purchase-anchored schedule (see DECISIONS.md):
//   - Story 1: 9 PM local on purchase night (immediate if bought after 9 PM).
//   - Stories 2-24: 9 PM local on a 2-2-3 day gap pattern from the purchase
//     date (3/week, never back-to-back).
//
// For each eligible user it sends at most ONE story per run, in their local
// 9 PM evening window, assembling the email from the story's content_blocks to
// match /emails/story-template.html exactly. Auth: Bearer CRON_SECRET.

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://stillatnine.com").replace(/\/$/, "");
const FROM = "Still at Nine <stories@stillatnine.com>";
const REPLY_TO = "hello@stillatnine.com";
const TOTAL_STORIES = 24;
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
    const boughtAfterNine = purchaseL.hour >= 21;
    if (boughtAfterNine) return { due: true, storyNo, weekday: nowL.weekday };
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
// Email HTML — generated to match /emails/story-template.html
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type Block =
  | { kind: "lead" | "p" | "quote"; text: string }
  | { kind: "section"; label: string }
  | { kind: "list"; items: string[] };

function renderBlocks(blocks: Block[]): string {
  return blocks.map((b) => {
    switch (b.kind) {
      case "lead": {
        const t = esc(b.text);
        const first = t.charAt(0);
        const rest = t.slice(1);
        return `<p class="lead es-p" style="margin:0 0 24px;font-family:'Spectral',Georgia,serif;font-size:19.5px;line-height:1.66;color:#1A140D;"><span style="float:left;font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:62px;line-height:0.84;color:#9C6B1B;padding:4px 12px 0 0;">${first}</span>${rest}</p>`;
      }
      case "p":
        return `<p style="margin:0 0 22px;font-family:'Spectral',Georgia,serif;font-size:17px;line-height:1.72;color:#1A140D;">${esc(b.text)}</p>`;
      case "section":
        return `<div style="text-align:center;margin:38px 0 22px;color:#9C6B1B;line-height:1;font-size:0;"><span style="display:inline-block;width:60px;height:1px;background:#9C6B1B;opacity:0.45;vertical-align:middle;"></span><span style="font-family:Georgia,serif;font-size:11px;opacity:0.85;margin:0 12px;vertical-align:middle;">&#10022;</span><span style="display:inline-block;width:60px;height:1px;background:#9C6B1B;opacity:0.45;vertical-align:middle;"></span></div>`
          + `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;"><tr><td style="white-space:nowrap;font-family:'Spectral SC','Spectral',Georgia,serif;font-size:12.5px;letter-spacing:0.26em;text-transform:uppercase;color:#9C6B1B;vertical-align:middle;">${esc(b.label)}</td><td style="padding-left:12px;vertical-align:middle;"><div style="height:1px;background:#E4DBCB;font-size:0;line-height:1px;">&nbsp;</div></td></tr></table>`;
      case "quote":
        return `<div style="margin:32px 0;text-align:center;padding:0 12px;"><div style="color:#9C6B1B;font-size:13px;margin-bottom:14px;font-family:Georgia,serif;letter-spacing:0.3em;">&#10022;</div><p class="quote" style="margin:0;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:500;font-size:23px;line-height:1.5;color:#1A140D;">${esc(b.text)}</p><div style="color:#9C6B1B;font-size:13px;margin-top:14px;font-family:Georgia,serif;letter-spacing:0.3em;">&#10022;</div></div>`;
      case "list":
        return `<ul style="margin:0 0 22px;padding-left:22px;">${b.items.map((it) => `<li style="margin:0 0 8px;font-family:'Spectral',Georgia,serif;font-size:17px;line-height:1.72;color:#1A140D;">${esc(it)}</li>`).join("")}</ul>`;
      default:
        return "";
    }
  }).join("\n");
}

type Source = string | { text: string; url?: string };

function renderSources(sources: Source[] | null, disclaimer: string | null): string {
  if (!sources?.length && !disclaimer) return "";
  const rows = (sources ?? []).map((s, i) => {
    const isLast = i === (sources!.length - 1);
    const text = typeof s === "string" ? esc(s) : esc(s.text);
    const body = typeof s === "object" && s.url
      ? `<a href="${esc(s.url)}" style="color:#6B6051;text-decoration:underline;">${text}</a>`
      : text;
    return `<p style="margin:0 0 ${isLast ? 0 : 10}px;font-family:'Spectral',Georgia,serif;font-size:13.5px;line-height:1.55;color:#6B6051;"><span style="color:#9C6B1B;margin-right:8px;">&middot;</span>${body}</p>`;
  }).join("");
  const disc = disclaimer
    ? `<div style="height:1px;background:#E4DBCB;margin:16px 0;font-size:0;line-height:1px;">&nbsp;</div><p style="margin:0;font-family:'Spectral',Georgia,serif;font-style:italic;font-size:13.5px;line-height:1.6;color:#8A7C68;">${esc(disclaimer)}</p>`
    : "";
  return `<div style="font-family:'Spectral SC','Spectral',Georgia,serif;font-size:11.5px;letter-spacing:0.24em;text-transform:uppercase;color:#9C6B1B;margin-bottom:16px;">Sources &amp; record</div>${rows}${disc}`;
}

type Story = {
  story_number: number;
  title: string;
  category: string | null;
  read_minutes: number | null;
  content_blocks: Block[];
  sources: Source[] | null;
  disclaimer: string | null;
  subject_line: string | null;
  preheader: string | null;
};

function buildEmail(story: Story, dateLabel: string, manageUrl: string, unsubUrl: string): string {
  const n = story.story_number;
  const category = story.category ?? "Still at Nine";
  const readMins = story.read_minutes ?? 6;
  const preheader = story.preheader ?? "";
  const nextLine = n >= TOTAL_STORIES
    ? "That was the last of the twenty-four. Thank you for reading."
    : "The next arrives at 9 PM.";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Still at Nine — ${esc(story.title)}</title>
<!--[if mso]><style>*{font-family:Georgia,'Times New Roman',serif!important;}</style><![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Spectral:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Spectral+SC:wght@500&display=swap" rel="stylesheet">
<style>
  :root{color-scheme:light dark;supported-color-schemes:light dark;}
  body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table{border-collapse:collapse;}
  img{border:0;line-height:100%;outline:none;text-decoration:none;}
  a{text-decoration:none;}
  .px{padding-left:44px;padding-right:44px;}
  @media only screen and (max-width:600px){
    .px{padding-left:24px!important;padding-right:24px!important;}
    .title{font-size:28px!important;line-height:1.18!important;}
    .lead{font-size:18px!important;}
    .quote{font-size:20px!important;}
    .mast-name{font-size:17px!important;}
  }
  @media (prefers-color-scheme: dark){
    .es-page{background:#100B06!important;}
    .es-shell{background:#FFFDF8!important;}
    .es-mast{background:#130F0A!important;}
    .es-body{background:#FFFDF8!important;}
    .es-card{background:#F7F1E6!important;}
    .es-foot{background:#130F0A!important;}
    .es-h{color:#1A140D!important;}
    .es-p{color:#1A140D!important;}
    .es-mut{color:#6B6051!important;}
    .es-soft{color:#8A7C68!important;}
    .es-acc{color:#9C6B1B!important;}
    .es-mast .es-h,.es-foot .es-h{color:#F0E9DC!important;}
    .es-mast .es-mut,.es-foot .es-mut{color:#9C8E78!important;}
    .es-foot .es-acc{color:#D8A24C!important;}
  }
  [data-ogsc] .es-body{background:#FFFDF8!important;}
  [data-ogsc] .es-h{color:#1A140D!important;}
  [data-ogsc] .es-p{color:#1A140D!important;}
</style>
</head>
<body style="margin:0;padding:0;background:#100B06;">

<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:#100B06;font-size:1px;line-height:1px;">
  ${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="es-page" style="background:#100B06;">
<tr><td align="center" style="padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="es-shell" style="width:600px;max-width:600px;background:#FFFDF8;">

  <tr><td class="px es-mast" style="background:#130F0A;padding:24px 44px 22px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td align="left" width="100%" style="width:100%;vertical-align:middle;">
        <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#D8A24C;vertical-align:middle;box-shadow:0 0 14px 2px rgba(216,162,76,0.55);"></span>
        <span class="mast-name es-h" style="font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:19px;color:#F0E9DC;letter-spacing:-0.01em;margin-left:10px;vertical-align:middle;">Still at Nine</span>
      </td>
      <td align="right" class="es-mut" style="vertical-align:middle;white-space:nowrap;padding-left:20px;font-family:'Spectral SC','Spectral',Georgia,serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#9C8E78;">Story ${n} / ${TOTAL_STORIES}</td>
    </tr></table>
  </td></tr>

  <tr><td class="px es-body" style="background:#FFFDF8;padding:42px 44px 6px;">
    <div class="es-acc" style="font-family:'Spectral SC','Spectral',Georgia,serif;font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#9C6B1B;margin-bottom:18px;">${esc(category)}</div>
    <h1 class="title es-h" style="margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:34px;line-height:1.16;letter-spacing:-0.015em;color:#1A140D;">${esc(story.title)}</h1>
    <div class="es-soft" style="margin-top:18px;font-family:'Spectral SC','Spectral',Georgia,serif;font-size:11.5px;letter-spacing:0.16em;text-transform:uppercase;color:#8A7C68;">${esc(dateLabel)} &nbsp;&middot;&nbsp; ${readMins} min read</div>
    <div style="height:1px;background:#E4DBCB;margin:26px 0 4px;line-height:1px;font-size:0;">&nbsp;</div>
  </td></tr>

  <tr><td class="px es-body" style="background:#FFFDF8;padding:24px 44px 8px;">
${renderBlocks(story.content_blocks)}
  </td></tr>

  <tr><td class="px es-body" style="background:#FFFDF8;padding:14px 44px 40px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="es-card" style="background:#F7F1E6;border:1px solid #E4DBCB;margin-top:18px;">
      <tr><td style="padding:26px 28px;">
        ${renderSources(story.sources, story.disclaimer)}
      </td></tr>
    </table>
  </td></tr>

  <tr><td class="px es-foot" style="background:#130F0A;padding:34px 44px 40px;border-top:1px solid #2C231A;text-align:center;">
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#D8A24C;vertical-align:middle;box-shadow:0 0 12px 2px rgba(216,162,76,0.5);"></span>
    <span class="es-h" style="font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:16px;color:#F0E9DC;letter-spacing:-0.01em;margin-left:9px;vertical-align:middle;">Still at Nine</span>
    <p class="es-mut" style="margin:16px 0 0;font-family:'Spectral',Georgia,serif;font-style:italic;font-size:14px;line-height:1.6;color:#9C8E78;">You&rsquo;ve just read story ${n} of ${TOTAL_STORIES}. ${nextLine}</p>
    <p class="es-mut" style="margin:22px 0 0;font-family:'Spectral SC','Spectral',Georgia,serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9C8E78;">
      <a href="${esc(manageUrl)}" class="es-acc" style="color:#D8A24C;text-decoration:none;">Manage delivery</a>
      <span style="color:#9C8E78;margin:0 10px;">&middot;</span>
      <a href="${esc(unsubUrl)}" class="es-acc" style="color:#D8A24C;text-decoration:none;">Unsubscribe</a>
    </p>
    <p class="es-mut" style="margin:20px 0 0;font-family:'Spectral',Georgia,serif;font-size:12px;line-height:1.6;color:#6E624E;">Still at Nine &middot; [123 Example Street, City, Country]<br>You&rsquo;re receiving this because you purchased the Still at Nine collection.</p>
    <p class="es-mut" style="margin:14px 0 0;font-family:'Spectral',Georgia,serif;font-size:11.5px;color:#5C5240;">&copy; 2026 Still at Nine. Reply to this email and it reaches a person.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Sending + logging
// ---------------------------------------------------------------------------

async function sendStory(supabase: SupabaseClient, user: User, story: Story, weekday: string) {
  const dateLabel = `${weekday}, 9:00 PM`;
  const manageUrl = `${SITE_URL}/manage?u=${user.id}`;
  const unsubUrl = `${SITE_URL}/api/unsubscribe?u=${user.id}`;
  const html = buildEmail(story, dateLabel, manageUrl, unsubUrl);

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
    await supabase
      .from("users")
      .update({ current_story: story.story_number })
      .eq("id", user.id);
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
    // Skip past the doomed story so later stories can still flow.
    await supabase.from("users").update({ current_story: story.story_number }).eq("id", user.id);
  }
  return { ok: false, error: errText, abandoned };
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
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });
  const now = new Date();

  // Eligible users: paid, active, timezone known, not finished.
  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, timezone, purchased_at, current_story")
    .eq("refunded", false)
    .eq("unsubscribed", false)
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
