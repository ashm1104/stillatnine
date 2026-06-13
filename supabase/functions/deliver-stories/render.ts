// Story email rendering — pure functions, no Deno/Node specifics, so the same
// code runs in the delivery Edge Function (Deno) and the local preview script
// (scripts/preview-story.ts via tsx). Output matches /emails/story-template.html.
//
// Two audiences share ONE template (per the funnel doc: "identical template to
// paid emails"); only the footer + masthead badge change:
//   - paid       — buyers, "Story N / 24" + "next arrives <weekday>"
//   - free_soft  — funnel free story #1 (soft footer)
//   - free_firm  — funnel free story #2 ("your last free story")
//   - occasional — dormant-list occasional free story (soft footer)
// The PITCH email (no story body) is buildPitchEmail().

export type Block =
  | { kind: "lead" | "p" | "quote"; text: string }
  | { kind: "section"; label: string }
  | { kind: "list"; items: string[] };

export type Source = string | { text: string; url?: string };

export type Story = {
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

export const TOTAL_STORIES = 24;

/** Footer variant — selects the masthead badge + footer copy. */
export type Footer =
  // `isLast` is explicit because a graduated buyer's final paid story may be
  // (say) #23 if they read #24 for free — so n>=24 can't be inferred.
  | { kind: "paid"; nextWeekday?: string | null; isLast?: boolean }
  | { kind: "free_soft"; price: string; buyUrl: string }
  | { kind: "free_firm"; remaining: number; buyUrl: string; hooks?: string[] }
  | { kind: "occasional"; price: string; buyUrl: string }
  | { kind: "pitch" }; // no sales lead — the pitch body already sells

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderBlocks(blocks: Block[]): string {
  return blocks.map((b) => {
    switch (b.kind) {
      case "lead": {
        const t = esc(b.text);
        return `<p class="lead es-p" style="margin:0 0 24px;font-family:'Spectral',Georgia,serif;font-size:19.5px;line-height:1.66;color:#1A140D;"><span style="float:left;font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:62px;line-height:0.84;color:#9C6B1B;padding:4px 12px 0 0;">${t.charAt(0)}</span>${t.slice(1)}</p>`;
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

// ---------------------------------------------------------------------------
// Shared chrome — <head>, masthead, footer shell. Reused by story + pitch.
// ---------------------------------------------------------------------------

function head(titleText: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(titleText)}</title>
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
</head>`;
}

/** Hidden preheader span. */
function preheaderSpan(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:#100B06;font-size:1px;line-height:1px;">
  ${esc(text)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>`;
}

/** Masthead row. `badge` is the right-aligned label (e.g. "Story 3 / 24"). */
function masthead(badge: string): string {
  return `  <tr><td class="px es-mast" style="background:#130F0A;padding:24px 44px 22px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td align="left" width="100%" style="width:100%;vertical-align:middle;">
        <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#D8A24C;vertical-align:middle;box-shadow:0 0 14px 2px rgba(216,162,76,0.55);"></span>
        <span class="mast-name es-h" style="font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:19px;color:#F0E9DC;letter-spacing:-0.01em;margin-left:10px;vertical-align:middle;">Still at Nine</span>
      </td>
      <td align="right" class="es-mut" style="vertical-align:middle;white-space:nowrap;padding-left:20px;font-family:'Spectral SC','Spectral',Georgia,serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#9C8E78;">${esc(badge)}</td>
    </tr></table>
  </td></tr>`;
}

/** Footer copy for each variant: the italic "reason" line + the disclosure. */
function footerLines(footer: Footer, storyNumber: number): { lead: string; reason: string } {
  const acc = (text: string, url: string) =>
    `<a href="${esc(url)}" class="es-acc" style="color:#D8A24C;text-decoration:underline;">${esc(text)}</a>`;
  const signedUp = "You&rsquo;re receiving this because you signed up for free stories at stillatnine.com.";

  switch (footer.kind) {
    case "paid": {
      const isLast = footer.isLast ?? storyNumber >= TOTAL_STORIES;
      const nextLine = isLast
        ? "That was the last of the twenty-four. Thank you for reading."
        : footer.nextWeekday
        ? `The next arrives ${esc(footer.nextWeekday)} at 9 PM.`
        : "The next arrives at 9 PM.";
      return {
        lead: `You&rsquo;ve just read story ${storyNumber} of ${TOTAL_STORIES}. ${nextLine}`,
        reason: "You&rsquo;re receiving this because you purchased the Still at Nine collection.",
      };
    }
    case "free_soft":
      return {
        lead: `This was a free story from Still at Nine. The First Collection is 24 of these &mdash; ${acc(`${footer.price}, once`, footer.buyUrl)}.`,
        reason: signedUp,
      };
    case "free_firm": {
      const hooks = footer.hooks?.length
        ? `<br><span style="font-style:italic;">Still locked: ${footer.hooks.slice(0, 2).map(esc).join("; ")}.</span>`
        : "";
      return {
        lead: `That was your last free story. ${acc(`There are ${footer.remaining} more, waiting.`, footer.buyUrl)}${hooks}`,
        reason: signedUp,
      };
    }
    case "occasional":
      return {
        lead: `A free story, sent now and then. The First Collection is 24 of these &mdash; ${acc(`${footer.price}, once`, footer.buyUrl)}.`,
        reason: signedUp,
      };
    case "pitch":
      return { lead: "", reason: signedUp };
  }
}

/** The dark footer block (lamp, reason line, unsubscribe, address, copyright). */
function footerBlock(footer: Footer, storyNumber: number, unsubUrl: string): string {
  const { lead, reason } = footerLines(footer, storyNumber);
  const leadHtml = lead
    ? `<p class="es-mut" style="margin:16px 0 0;font-family:'Spectral',Georgia,serif;font-style:italic;font-size:14px;line-height:1.6;color:#9C8E78;">${lead}</p>`
    : "";
  return `  <tr><td class="px es-foot" style="background:#130F0A;padding:34px 44px 40px;border-top:1px solid #2C231A;text-align:center;">
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#D8A24C;vertical-align:middle;box-shadow:0 0 12px 2px rgba(216,162,76,0.5);"></span>
    <span class="es-h" style="font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:16px;color:#F0E9DC;letter-spacing:-0.01em;margin-left:9px;vertical-align:middle;">Still at Nine</span>
    ${leadHtml}
    <p class="es-mut" style="margin:22px 0 0;font-family:'Spectral SC','Spectral',Georgia,serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9C8E78;">
      <a href="${esc(unsubUrl)}" class="es-acc" style="color:#D8A24C;text-decoration:none;">Unsubscribe</a>
    </p>
    <p class="es-mut" style="margin:20px 0 0;font-family:'Spectral',Georgia,serif;font-size:12px;line-height:1.6;color:#6E624E;">Still at Nine &middot; [123 Example Street, City, Country]<br>${reason}</p>
    <p class="es-mut" style="margin:14px 0 0;font-family:'Spectral',Georgia,serif;font-size:11.5px;color:#5C5240;">&copy; 2026 Still at Nine. Reply to this email and it reaches a person.</p>
  </td></tr>`;
}

// ---------------------------------------------------------------------------
// Story email
// ---------------------------------------------------------------------------

/**
 * Assemble the full story email HTML. `footer` selects the masthead badge +
 * footer copy (paid buyer vs free funnel story vs occasional).
 */
export function buildEmail(
  story: Story,
  dateLabel: string,
  unsubUrl: string,
  footer: Footer = { kind: "paid" },
): string {
  const n = story.story_number;
  const category = story.category ?? "Still at Nine";
  const readMins = story.read_minutes ?? 6;
  const preheader = story.preheader ?? "";
  const badge = footer.kind === "paid" ? `Story ${n} / ${TOTAL_STORIES}` : "A free story";

  return `${head(`Still at Nine — ${story.title}`)}
<body style="margin:0;padding:0;background:#100B06;">

${preheaderSpan(preheader)}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="es-page" style="background:#100B06;">
<tr><td align="center" style="padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="es-shell" style="width:600px;max-width:600px;background:#FFFDF8;">

${masthead(badge)}

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

${footerBlock(footer, n, unsubUrl)}

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Pitch email (step 3) — no story body. Short, Archivist voice: what the
// collection is, a few named locked hooks, price + anchor, one button.
//
// NOTE: the marketing copy here is a DRAFT for owner review (see
// launch-reference.md Part 5 — "Pitch email copy (write together)"). Structure
// is final; words are placeholder-quality and meant to be rewritten together.
// ---------------------------------------------------------------------------

export type PitchOpts = {
  price: string; // e.g. "$19"
  anchor: string; // e.g. "$24"
  buyUrl: string; // checkout/landing link with ?src=pitch
  unsubUrl: string;
  hooks: string[]; // 3–4 named locked-story hooks
};

export function buildPitchEmail(opts: PitchOpts): string {
  const { price, anchor, buyUrl, unsubUrl, hooks } = opts;
  const preheader = "The first collection — twenty-four of these, one payment.";

  const hookList = hooks.slice(0, 4).map((h) =>
    `<tr><td style="padding:0 0 12px;vertical-align:top;"><span style="color:#9C6B1B;font-family:Georgia,serif;margin-right:10px;">&#10022;</span><span style="font-family:'Spectral',Georgia,serif;font-size:17px;line-height:1.6;color:#1A140D;">${esc(h)}</span></td></tr>`
  ).join("");

  return `${head("Still at Nine — The First Collection")}
<body style="margin:0;padding:0;background:#100B06;">

${preheaderSpan(preheader)}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="es-page" style="background:#100B06;">
<tr><td align="center" style="padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="es-shell" style="width:600px;max-width:600px;background:#FFFDF8;">

${masthead("The First Collection")}

  <tr><td class="px es-body" style="background:#FFFDF8;padding:42px 44px 6px;">
    <div class="es-acc" style="font-family:'Spectral SC','Spectral',Georgia,serif;font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#9C6B1B;margin-bottom:18px;">A note from the Archivist</div>
    <h1 class="title es-h" style="margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:32px;line-height:1.18;letter-spacing:-0.015em;color:#1A140D;">Twenty-four of these. One payment.</h1>
    <div style="height:1px;background:#E4DBCB;margin:26px 0 4px;line-height:1px;font-size:0;">&nbsp;</div>
  </td></tr>

  <tr><td class="px es-body" style="background:#FFFDF8;padding:24px 44px 8px;">
    <p style="margin:0 0 22px;font-family:'Spectral',Georgia,serif;font-size:17px;line-height:1.72;color:#1A140D;">You&rsquo;ve read two of mine now. The rest of the collection is twenty-four stories like them &mdash; each one true, each one documented, each one arriving at nine.</p>
    <p style="margin:0 0 22px;font-family:'Spectral',Georgia,serif;font-size:17px;line-height:1.72;color:#1A140D;">No subscription, no app, nothing to log into. One payment, and they come three nights a week until the collection is done.</p>
    <p style="margin:0 0 18px;font-family:'Spectral SC','Spectral',Georgia,serif;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#9C6B1B;">Still locked</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 8px;">${hookList}</table>
  </td></tr>

  <tr><td class="px es-body" style="background:#FFFDF8;padding:18px 44px 44px;" align="center">
    <a href="${esc(buyUrl)}" style="display:inline-block;background:#D8A24C;color:#1A140D;font-family:'Spectral SC','Spectral',Georgia,serif;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;padding:16px 34px;border-radius:2px;font-weight:600;">Get the First Collection &mdash; <span style="text-decoration:line-through;opacity:0.6;">${esc(anchor)}</span> ${esc(price)}</a>
    <p style="margin:18px 0 0;font-family:'Spectral',Georgia,serif;font-style:italic;font-size:14px;line-height:1.6;color:#6B6051;">The first story arrives tonight if you join before nine.</p>
  </td></tr>

${footerBlock({ kind: "pitch" }, 0, unsubUrl)}

</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Marketing price + anchor for a currency (mirrors src/lib/pricing). */
export function priceFor(currency: string | null | undefined): { price: string; anchor: string } {
  return (currency || "").toUpperCase() === "INR"
    ? { price: "₹499", anchor: "₹799" }
    : { price: "$19", anchor: "$24" };
}
