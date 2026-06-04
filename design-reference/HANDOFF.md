# Still at Nine — Developer Handoff ("How to Use")

> **Purpose.** This document maps every design decision, token, component, and
> asset to its source file and intended use. When building the production app
> (Next.js on Vercel), **build from what exists here — do not invent** colors,
> fonts, spacing, copy, or components. If something you need isn't in this doc,
> stop and ask rather than improvising.

**Locked source of truth for brand decisions:** `CLAUDE.md` (project root).
**Visual reference (open in a browser):** `Handoff — Start Here.html`.

---

## 0. Product facts (do not re-derive)

| Thing | Value |
|---|---|
| Name | **Still at Nine** |
| Tagline (short) | Stories after dark. |
| Tagline (full) | Strange, true stories. Delivered after dark. |
| Domain | stillatnine.com |
| Model | One-time purchase — 24 stories over 8 weeks |
| Price | $19 (anchor ~~$24~~) · India ₹499 (anchor ~~₹799~~) |
| Cadence | 3 stories / week, delivered 9 PM reader-local |
| Sender | `stories@stillatnine.com` (from-name: **Still at Nine**) |
| Inbound | `hello@stillatnine.com` |
| Stack | Next.js (Vercel) · Supabase · Resend · Dodo Payments |

---

## 1. File map — where everything lives

### Design tokens & styles
| File | Use |
|---|---|
| `tokens-locked.css` | **Canonical** design tokens (`--san-*`). Import first, everywhere. |
| `lp-styles.css` | Landing-page stylesheet. Defines short-alias tokens (`--ac`, `--dk`…) + all `.sec`, `.hero`, `.story-*`, `.how-*`, `.modal`, atmosphere, responsive rules. |
| `tx-styles.css` | Transactional-page styles (thank-you/unsub/404/error/loading + animations). |

### Live React mocks (reference implementations — JSX, Babel-in-browser)
| File | Renders |
|---|---|
| `Landing Page.html` + `lp-app.jsx` | Full marketing page, all 8 sections. |
| `Story Email.html` + `email-app.jsx` | Email **preview harness** (mail-client chrome + tweaks). |
| `email-template.jsx` | The story-email body component + `ETHEMES`. |
| `email-data.jsx` | Story content + subject/preheader (the `EMAIL` object). |
| `welcome-template.jsx` + `welcome-data.jsx` | Welcome email body + content (`WELCOME`). |
| `Transactional Pages.html` + `tx-app.jsx` | Thank-you, unsubscribe, 404, error, loading. |
| `Identity & Social Assets.html` + `identity-canvas.jsx` | Logo guidelines + asset review. |
| `Still at Nine - Brand Foundation.html` + `guide-app.jsx` | Living brand reference. |

### Production-ready, copy-paste HTML (NOT React — use these for sends)
| File | Use |
|---|---|
| `Story Email - Send-Ready.html` | Paste into Resend / ESP for the recurring story send. |
| `Welcome Email - Send-Ready.html` | Paste into ESP for the post-purchase welcome. |

### Image assets
| Folder | Contents |
|---|---|
| `brand/` | `Full Logo.png`, `horizontal_logo.png`, `symbol.png` (dot mark), `badge.png` (circular seal), `favicon.png` (dark), `favocin_light.png` (light) |
| `exports/` | `apple-touch-icon.png` (180²), `og-image.png` (1200×630), `twitter-card.png` (1200×675), `profile-picture.png` (1000²), `social-banner.png` (1500×500) |

> **Note on the JSX mocks:** they use in-browser Babel for *review only*. In
> production, port the markup to real Next.js components/CSS modules. The mocks
> are the spec; match them exactly. Do not ship Babel-in-browser.

---

## 2. Design tokens — use these names

All tokens are defined in **`tokens-locked.css`** under `:root`. These are
canonical. `lp-styles.css` also exposes short aliases used throughout the
landing/transactional CSS — both refer to the same values.

### Color (canonical `--san-*` → short alias)
**Dark context (hero / after-dark / email masthead & footer):**
- bg `#130F0A` `--san-dk-bg` / `--dk`
- surface `#1E1811` `--san-dk-surface` / `--dk2`
- text `#F0E9DC` `--san-dk-text` / `--tdk`
- muted `#9C8E78` `--san-dk-muted` / `--mdk`
- border `#2C231A` `--san-dk-border` / `--bdk`
- accent `#D8A24C` `--san-dk-accent` / `--ac`

**Light context (reading body / cream surfaces):**
- bg `#F5EFE4` `--san-lt-bg` / `--lt`
- surface `#FFFDF8` `--san-lt-surface` / `--lt2`
- text `#1A140D` `--san-lt-text` / `--tlt`
- muted `#6B6051` `--san-lt-muted` / `--mlt`
- border `#E4DBCB` `--san-lt-border` / `--blt`
- accent `#9C6B1B` `--san-lt-accent` / `--ac2`

**CTA:** bg `#D8A24C` `--san-cta-bg` · text `#130F0A` `--san-cta-text` · hover bg `#E6B663` `--san-cta-bg-hover` (`--ac-hover`).

> **Rule:** amber `#D8A24C` is the *only* accent. Never introduce a second hue,
> a gradient-for-decoration, red/blood, or neon. Dark accent = `#D8A24C`,
> light-surface accent = `#9C6B1B` (the same amber, darkened for contrast on cream).

### Spacing — 4px base (`--san-space-*`)
`3xs 4` · `2xs 8` · `xs 12` · `sm 16` · `md 24` · `lg 32` · `xl 48` · `2xl 64` · `3xl 96` · `4xl 128`

### Max-widths
- reading column `680px` `--san-w-read` / `--w-read`
- content `920px` `--san-w-content` / `--w-content`
- wide `1120px` `--san-w-wide` / `--w-wide`

---

## 3. Typography — "The Archive"

| Role | Family | Weight | Tracking | Token |
|---|---|---|---|---|
| Headings | **Playfair Display** | 600 | -0.01em | `--san-font-heading` |
| Body | **Spectral** | 400 | — | `--san-font-body` |
| Small caps / labels | **Spectral SC** | 500 | 0.16–0.30em, uppercase | — |
| Fallback (both) | Georgia, Times | — | — | — |

**Google Fonts import (web):**
`Playfair Display: ital,wght@0,500;0,600;0,700;1,500` · `Spectral: ital,wght@0,300;0,400;0,500;0,600;1,400` · `Spectral SC: wght@500;600`.

**In email:** keep the web-font `<link>` for Apple Mail, but every element MUST
carry an inline `font-family` ending in `Georgia, 'Times New Roman', serif` so
Gmail/Outlook fall back gracefully. The send-ready files already do this.

**Scale rules:** body text never below 15px in email, 16px on web. Headlines use
`clamp()` (see `.hero-title`, `.sec-h2`, `.tx-title`).

---

## 4. The atmosphere system ("lamplight")

The signature look = a warm radial **glow** from lower-centre/right, faint **light-pool arcs**, slow **embers**, a giant low-opacity **"9" watermark**, an **edge vignette**, and **50% grain**. Locked settings (from `CLAUDE.md`): glow 85%, medium embers, "9" on, arcs on, vignette on, grain 50%, no archival frame.

- **Reference implementation:** `HeroAtmosphere({ level })` in `lp-app.jsx`
  (levels: `rich` = 0.85, `subtle` = 0.5, `none`). The transactional version is
  `Atmosphere({ level })` in `tx-app.jsx`.
- **CSS hooks:** `.atmo`, `.atmo-glow`, `.atmo-arcs`, `.atmo-embers`,
  `.atmo-nine`, `.atmo-vig`, `.grain` in `lp-styles.css`.
- Embers animation respects `prefers-reduced-motion`. Keep that.
- **Use it on:** hero, final CTA, all transactional pages. **Don't** put it
  behind long reading text (it hurts legibility) — that's why email bodies are
  cream with no atmosphere.

---

## 5. Logo & identity

**The mark = "The Underscore":** a glowing amber dot (the lamp) + "Still at Nine"
in Playfair 600 + an amber underscore line. Tagline "Stories after dark." Diamond
rule `✦ — ✦` only in the full lockup.

### In-product: render as live components, not PNGs
| Component (`lp-app.jsx`) | Use |
|---|---|
| `LogoMark({ size, dark })` | Standalone dot mark (navbar, footer, inline). |
| `LogoWordmark({ color, accent, size })` | Stacked wordmark + underscore. |
| `LogoHorizontal({ dark, size })` | Wordmark + tagline + underscore, one row. |

### PNG assets (use where live render isn't possible)
- **Email sender avatar / social profile pic:** `brand/badge.png` (circular seal).
- **Favicon:** `brand/favicon.png` → also export 16/32 from it. Light UI: `brand/favocin_light.png`.
- **Apple touch icon:** `exports/apple-touch-icon.png` (180×180).
- `brand/Full Logo.png`, `horizontal_logo.png`, `symbol.png` for decks/press.

### Usage rules (see `Identity & Social Assets.html`)
- Clear space = the wordmark's cap-height on all sides.
- Min size: 160px (digital lockup) · 96px (compact, no tagline) · 16px (dot mark).
- Never recolor the dot, stretch the wordmark, add shadows/gradients, or place
  on busy / pure-white backgrounds.

### `<head>` wiring
```html
<link rel="icon" href="/favicon.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<meta property="og:image" content="https://stillatnine.com/og-image.png"> <!-- 1200×630 -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://stillatnine.com/twitter-card.png">
```

---

## 6. Landing page — component & section map

Source: `Landing Page.html` → `lp-app.jsx` (+ `lp-styles.css`). All copy is
**locked** in the JSX — reuse verbatim. Sections in render order (`LandingPage`):

| # | Section | Component | Anchor id | CSS |
|---|---|---|---|---|
| 1 | Hero | `HeroSection` | `#hero` | `.hero`, `.hero-title`, `.hero-tagline` |
| 2 | What you'll read | `WhatYoullRead` | `#what` | `.sec`, `.sec-h2` |
| 3 | Stories like these | `StoriesSection` + `StoryModal` | `#stories` | `.story-item`, `.modal` |
| 4 | How it works (4-tile) | `HowItWorks` | `#how` | `.how-grid`, `.how-step` |
| 5 | What this is not | `WhatThisIsNot` | `#not` | `.sec--narrow` |
| 6 | Every story is real (trust) | `EveryStoryIsReal` | `#real` | `.sec--narrow` |
| 7 | Final CTA | `FinalCTA` | `#final-cta` | `.sec--cta`, `.cta-btn` |
| 8 | Who's behind this | `WhosBehind` | `#who` | `.who-card` |
| — | Navbar / Footer | `Navbar`, `Footer` | — | `.navbar`, `.lp-footer` |

**Shared building blocks:** `Eyebrow`, `DiamondRule`, `SectionWrap`,
`HeroAtmosphere`. Story data is the `STORIES` array in `lp-app.jsx`.

### Interactions
- **Story preview:** tap a `.story-item` → `StoryModal` opens with a preview that
  cuts off mid-sentence (`cutoff: true`) to tease the paid story. Animations:
  `fadeIn` + `slideUp` (in `lp-styles.css`).
- **Navbar:** adds `.navbar--scrolled` after 60px scroll (`Navbar` useEffect).
- **CTA states:** base + `:hover` (lift + `#E6B663`). For the **busy/loading**
  state when redirecting to Dodo checkout, reuse the spinner pattern from the
  transactional error button (`.tx-cta--busy` + `.tx-spin`, see §8).
- **Anchor pricing:** `.strike` class — `<span class="strike">$24</span> $19`.

### Locked production config
The mock exposes "Tweaks" for exploration. **Build with these defaults** (from
`LP_DEFAULTS` in `lp-app.jsx`) unless the founder says otherwise:
`heroLayout: 'cinematic'` · `sectionStyle: 'alternating'` · `storyCards: 'archive'` · `atmosphere: 'rich'`.
The other tweak options exist for flexibility; they are not separate deliverables.

### Responsive
Breakpoints already defined in `lp-styles.css`: `560px` (navbar collapses),
`768px` (hero grid, how-grid, modal padding stack). Hit targets ≥ 44px.

---

## 7. Story email — the recurring product

**Ship from:** `Story Email - Send-Ready.html` (table layout, inline styles, no
image dependencies). **Spec/reference:** `email-template.jsx` (`EmailTemplate`).

### Locked design choice
**Theme = `hybrid`, Atmosphere = `full`.** Hybrid = dark masthead + footer,
cream reading body. This is the default in the mock and what the send-ready file
is built as. The `dark` and `cream` themes in `ETHEMES` are alternatives, not
to be shipped unless requested.

### Structure (top → bottom)
masthead (brand + "Story N / 24") → category eyebrow → Playfair title → date ·
read-time → hairline → drop-cap lead → body (sections w/ amber labels + rules) →
centered italic pull-quote framed by `✦` → **Sources & record** box + italic
disclaimer → footer (brand, "next at 9 PM", manage/unsubscribe, address, ©).

### Content model — `EMAIL` object in `email-data.jsx`
Populate per story from the content pipeline. Body is an array of typed blocks:
`{ kind: 'lead' | 'p' | 'section' | 'quote', text / label }`. Also: `fromName`,
`fromEmail`, `subject`, `preheader`, `dateLabel`, `storyNo`, `storyTotal`,
`category`, `readMins`, `title`, `sources[]`, `disclaimer`. **Keep the
calm-archivist voice** — see the Wow! Signal sample as the tone reference.

### Email-safe constraints (already handled — keep them)
- 600px container, `role="presentation"` tables, all styling inline.
- Hidden **preheader** div first in body. Preheader strategy: continue the hook,
  never repeat the subject, end mid-thought.
- **Dark-mode lock:** `@media (prefers-color-scheme: dark)` block + `.es-*`
  classes restate brand colors so Apple Mail/Gmail don't auto-invert. Plus
  `[data-ogsc]` for Outlook.com. Keep both; never remove the `.es-*` hooks.
- Mobile `@media (max-width:600px)` shrinks padding + type.

### ESP integration (Resend)
Replace before sending:
- `[123 Example Street, City, Country]` → real physical mailing address (CAN-SPAM).
- `{{manage_url}}` / `{{unsubscribe_url}}` → Resend/ESP unsubscribe + preference tokens.
- Sender profile: from-name **Still at Nine**, from `stories@stillatnine.com`,
  avatar `badge.png`.

---

## 8. Welcome / onboarding email

**Ship from:** `Welcome Email - Send-Ready.html`. **Spec:** `welcome-template.jsx`
(`WelcomeTemplate`), content in `welcome-data.jsx` (`WELCOME`). Same hybrid+full
theme and `.es-*` dark-mode locks as the story email.

**Trigger:** immediately after successful purchase (Dodo webhook → Resend).
**Sequence intent:** sets rhythm (3/week, 24 over 8 weeks), restates the promise,
quiet deliverability nudge ("add to contacts"), teases tonight's first story
("No link to open. It will simply arrive."), signs off "Until nine, — The desk at
Still at Nine." Same address + merge-tag placeholders to replace.

---

## 9. Transactional pages

Source: `Transactional Pages.html` → `tx-app.jsx` (+ `tx-styles.css`). One file,
five states via the `PAGES` array. Each maps to a route:

| State | Component | Route suggestion | When |
|---|---|---|---|
| Thank-you / confirmation | `ThankYou` | `/welcome` or `/thanks` | After successful payment |
| Unsubscribe confirmation | `Unsubscribe` | `/unsubscribed` | After unsubscribe (has working "Light it again" resubscribe) |
| 404 | `NotFound` | `app/not-found` | Unknown route |
| Error | `ErrorState` | `/error` | Payment failed / generic. "Nothing was charged" reassurance + `hello@` help + **busy-state CTA**. |
| Loading | `Loading` | transition / Suspense fallback | Checkout redirect / page transition |

**Shared:** `Brand` (top-left lockup, links home), `Atmosphere`, `Footer`.

### Loading states (item #31)
- **Full-page loader:** breathing lamp + halo + progress shimmer →
  `.tx-loader`, `.tx-loader-lamp`, `.tx-loader-halo`, `.tx-progress`
  (`@keyframes breathe / halo / sweep`). Use as the Suspense/redirect fallback.
- **CTA busy state:** `.tx-cta--busy` + `.tx-spin` (`@keyframes spin`). Swap
  button label for `<span class="tx-spin"/>Processing…` while a request is in
  flight. Reuse on the landing-page checkout CTA too.
- Error page lamp uses `.tx-dot--flicker` (`@keyframes flicker`) — the lamp
  gutters but isn't out. All animations honor `prefers-reduced-motion`.

> The `.tx-switch` segmented control at the bottom is a **preview-only** device
> for reviewing all five states. Do **not** ship it — each state is its own route.

---

## 10. Locked copy decisions (Extras — items 52–54)

- **From-name:** **Still at Nine** (not "Still at Nine Stories").
- **Subject-line format:** evocative, declarative, no "Story #" prefix in the
  subject (the number lives in the masthead). Sample: *"A signal with no source.
  Forty years."* Keep subjects in-voice; the story title usually works.
- **Preheader:** always set, continues the hook, never repeats the subject, ends
  mid-thought. Hidden preheader div is the first element in the email body.

---

## 11. Pre-launch checklist (must-do before first send)

- [ ] Replace footer mailing address in **both** send-ready emails.
- [ ] Wire `{{manage_url}}` / `{{unsubscribe_url}}` to ESP tokens.
- [ ] Configure Resend sender: name **Still at Nine**, `stories@stillatnine.com`, avatar `badge.png`.
- [ ] Copy `exports/*` + `brand/favicon.png` + `apple-touch-icon.png` into Next.js `/public` and wire `<head>` (§5).
- [ ] Port JSX mocks to production React/CSS (no Babel-in-browser).
- [ ] Confirm landing config = `cinematic / alternating / archive / rich` (§6).
- [ ] Test both emails on iOS Mail + Gmail Android (verify dark-mode locks hold).
- [ ] Set 404 → `NotFound`, checkout redirect → `Loading`, payment failure → `ErrorState`.

---

## 12. Hard rules — do not invent

1. **Colors:** only the tokens in §2. Amber `#D8A24C` is the sole accent.
2. **Fonts:** only Playfair Display + Spectral (+ Spectral SC), Georgia fallback.
3. **Copy:** reuse the locked landing/email copy verbatim; don't rewrite voice.
4. **Atmosphere:** reuse the existing CSS/components; don't hand-roll a new glow.
5. **Logo:** render via the components or use the provided PNGs; never redraw.
6. **Email:** keep table layout, inline styles, preheader, and `.es-*` dark-mode
   hooks. Never strip them for "cleaner" markup.
7. **No new UI patterns** (cards with left-accent borders, gradients, emoji,
   rounded-pill everything). Match the existing restrained, editorial system.
8. If a needed asset/spec is missing, **ask** — don't fill the gap with a guess.

---

*Brand direction: Lamplight × The Archive. The feeling: reading something strange
at 9 PM with one lamp on. Build to that.*
