# Still at Nine — Build Decisions (as-built)

Decisions and resolutions made **during** the build that were unspecified,
marked `[FILL IN]`, or wrong in the original planning docs
(`tech-build-plan.md`, `CLAUDE.md`). This file is the canonical record for
anything the plan didn't pin down. Newest phase at the bottom.

---

## Phase 3 — Payment flow

### Dodo redirect params — RESOLVED (was `[FILL IN]`)
On a successful payment Dodo redirects to:

```
/welcome?payment_id=pay_xxx&status=succeeded&email=<urlencoded>
```

- **The buyer is identified by `payment_id`.** Confirmed param name against a
  real test payment. We never collect the email on our own site (it's entered
  on Dodo's hosted checkout), so `payment_id` is the *only* identifier — there
  is no email fallback by design.
- **`status`** drives failure routing: `/welcome` forwards any non-`succeeded`
  status to `/error` (and skips the timezone write).
- **`email`** is also in the URL, but we read it from the DB (via
  `set-timezone`'s response), not the URL — avoids depending on / leaking the
  URL param.

### Webhook — signature + events (as built)
- Dodo uses the **Standard Webhooks** spec: headers `webhook-id`,
  `webhook-signature`, `webhook-timestamp`; HMAC-SHA256 over the **raw** body.
- Verified with the **official `dodopayments` Node SDK** (`webhooks.unwrap`),
  in a `runtime = "nodejs"` route reading the raw request body (never parse
  before verifying).
- Events handled: **`payment.succeeded`** (upsert user + send welcome email),
  **`refund.succeeded`** (mark `refunded = true`). All other subscribed events
  (`payment.failed/cancelled/processing`, `refund.failed`) are acknowledged
  with 200 and ignored.
- **Idempotency:** upsert on `dodo_payment_id` with `ignoreDuplicates` → a
  duplicate webhook inserts no row, so the welcome email sends exactly once. A
  unique-violation on `email` (same buyer paying twice) is caught (Postgres
  `23505`) and treated as already-processed.

### Checkout links — static, with separate test/live hosts
- Format: `{base}/{product_id}?redirect_url=<site>/welcome` (static payment
  link; no server call).
- **Live host:** `https://checkout.dodopayments.com/buy`
  **Test host:** `https://test.checkout.dodopayments.com/buy`
  Selected via `NEXT_PUBLIC_DODO_CHECKOUT_BASE_URL`. Hitting the live host with
  a test-mode product → Dodo's `/error/not-found`.
- ⚠️ `NEXT_PUBLIC_*` are **baked at build time** — after changing any of them in
  Vercel you must **redeploy**, not just restart.

### Identity model — NO ACCOUNTS (locked)
- No login (no magic link, no Google). The product only *pushes* email; the
  welcome page/email explicitly promise "nothing to log into." Accounts would
  contradict the product.
- **Manage & Unsubscribe = signed token links** (the token is the credential,
  HMAC of the user id — no password). Build `/manage?token=…` (timezone /
  pause / resubscribe) and `/unsubscribe?token=…` in **Phase 5**.
- The welcome email's `{{manage_url}}` (→ `/welcome`) and `{{unsubscribe_url}}`
  (→ `/api/unsubscribe?u=…`) are **placeholders** until Phase 5.
- **Email-typo safety net** (no pre-capture, no verification step):
  1. `/welcome` echoes the delivery email for the buyer to eyeball
     ("…headed to `<email>` — not you? write to hello@…").
  2. The Resend bounce/complaint webhook (Phase 5) auto-flags dead addresses.
  Dodo (Merchant of Record) owns the checkout email; we do not collect it on
  our site.

### Welcome page behavior (as built)
- Captures timezone (`Intl`, `localStorage` fallback) → `POST /api/set-timezone`
  keyed by `payment_id`.
- **Webhook race:** `set-timezone` returns **202** while the webhook hasn't
  created the user row yet; the page retries (≤6× at 1.5s).
- `set-timezone` returns `{ currency, email }`; the receipt shows the **paid
  currency** (₹499 / $19, via `displayForCurrency`) and the email. Bullet 1
  shows the captured timezone label — **locale-derived** (e.g. `IST` on an
  India-locale browser, `GMT+5:30` on an en-US one; both correct).
- **`/error`** page was built in Phase 3 (ahead of Phase 5) to land
  cancelled/failed payments. Shared `Atmosphere`/`Brand`/`Footer` extracted to
  `src/components/TxChrome.tsx`.

### Email from/reply addresses
- Welcome email: **from** `Still at Nine <stories@stillatnine.com>`,
  **reply-to** `hello@stillatnine.com`.

---

## Environment variables — as-built names

These differ from an earlier draft in `tech-build-plan.md`. The `.env.example`
in the repo is the source of truth. Notable renames:

| Plan draft | As built |
|---|---|
| `DODO_API_KEY` | `DODO_PAYMENTS_API_KEY` |
| `DODO_PRODUCT_ID_GLOBAL` / `_INDIA` | `NEXT_PUBLIC_DODO_PRODUCT_ID_USD` / `_INR` |
| (none) | `NEXT_PUBLIC_DODO_CHECKOUT_BASE_URL` (test/live host switch) |
| `DELIVERY_CRON_SECRET` | `CRON_SECRET` |
| (none) | `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO` |

- Product IDs and the checkout base are `NEXT_PUBLIC` (they end up in the public
  checkout URL anyway) → **redeploy after changing**.
- The webhook + API routes run on **Vercel** and read these from **Vercel env
  vars** — NOT from the Supabase database. Only the Phase-4 delivery Edge
  Function gets its own **Supabase** secrets (`CRON_SECRET`, `RESEND_API_KEY`).

---

## Infrastructure / ops

### GitHub MCP is not connected
`CLAUDE.md` says "use GitHub MCP for all git operations," but it isn't wired up
in this environment. Use the **git CLI**. Workflow is **direct commits to
`master`**; Vercel **auto-deploys on push**. (Only the Supabase MCP is
connected — used for DB/schema/Edge Functions.)

### Secrets live in Vercel, not Supabase
Runtime API keys (`DODO_*`, `RESEND_*`, `SUPABASE_SERVICE_ROLE_KEY`) are Vercel
environment variables (+ `.env.local` for local dev). Supabase is the database,
not a secret store. `users.dodo_payment_id` is a reference id, not a secret.

### DNS (Cloudflare → Vercel)
- The **apex** `stillatnine.com` needs its own DNS record — a CNAME at `@` →
  the Vercel target (`a2310f...vercel-dns-017.com`); Cloudflare **flattens** the
  apex CNAME to A records. `www` alone is **not** enough: Dodo's webhook and
  redirect both target the apex.
- A CNAME-type lookup at the apex returns empty (because of flattening) — query
  **A** to check propagation, not CNAME.
- Canonical host = **apex**; set `www` → **301 → apex** in Vercel (also avoids
  the `localStorage`-is-per-origin gotcha between apex and www).

---

## Phase 4 — Delivery schedule (BUILT & LIVE)

**Model: per-user, anchored to the purchase night** — NOT the global Mon/Wed/Fri
in the original plan (that breaks the locked "first story tonight at 9" promise
and can deliver story 1 & 2 back-to-back).

- **Story 1:** the night of purchase at **9 PM local**. If they bought *after*
  9 PM local (missed the slot), story 1 is sent **immediately** — next cron run,
  so ≤15 min — to honor "tonight."
- **Stories 2–24:** 9 PM local on a repeating **2-2-3 day gap pattern** anchored
  to the purchase date → exactly 3/week, never back-to-back. Day offset from the
  purchase date for story `i` (1-based):
  `offset = week*7 + [0,2,4][pos]`, where `week = floor((i-1)/3)` and
  `pos = (i-1) % 3`. → 0, 2, 4, 7, 9, 11, 14, … ; story 24 lands at +53 days
  (~7.5 weeks).
- **Send window (as built):** cron every 15 min; a scheduled story fires on the
  first run where the user's local time is in the **evening (hour ≥ 21, i.e.
  9 PM–midnight)** on/after its due date — so a missed 9 PM slot still goes out
  that evening, otherwise the next evening. Story 1's immediate (after-9) case
  bypasses the gate. **≤1 story per user per local day** (guarded by the latest
  `delivery_history.sent_at`). **3 failures → abandon** + skip the story. Skip
  refunded/unsubscribed; require `timezone IS NOT NULL`.
- **No schema change** — uses `purchased_at`, `timezone`, `current_story`.
- Cron caller authed by **`CRON_SECRET`** (renamed from `DELIVERY_CRON_SECRET`),
  set as a Supabase Edge Function secret.

**Shipped & verified.** Edge Function `supabase/functions/deliver-stories`
(deployed via Supabase MCP; HTML renderer in `render.ts`, shared with the local
preview `scripts/preview-story.ts`). Triggered by cron-job.org (POST +
`Authorization: Bearer CRON_SECRET`). Tested end-to-end: real send, correct
`delivery_history` + `current_story`, idempotent no-op on re-run. Content
pipeline: format `content/README.md`, importer `scripts/import-story.ts`,
structuring-agent prompt `content/structuring-agent.md`; stories 1 & 2 seeded.
⚠️ `CRON_SECRET` was shared in chat during testing — rotate before launch.

**Communicating the schedule** (resolves the "which nights?" friction — the
trio is fixed per reader since 2+2+3=7, but they must be *told*). Surface it
wherever we know the timezone:
- **Welcome page (SHIPPED):** "Your stories arrive **Tuesdays, Thursdays &
  Saturdays** at 9 PM IST", plus bullet 1 "…then every Tue, Thu & Sat".
  `set-timezone` computes the trio from `purchased_at` + the just-saved tz and
  returns `nights[]`; the page renders it (falls back to "three nights a week"
  until the order resolves).
- **Story-email footer (PENDING):** currently generic "The next arrives at
  9 PM." Personalising to the next weekday ("The next arrives Thursday at 9 PM")
  is a small Edge Function follow-up — compute the next due weekday in
  `index.ts` and pass it to `buildEmail`.
- **Welcome email:** stays generic ("starting tonight, three nights a week") —
  it's sent by the webhook *before* the timezone is captured.
- **Landing page:** stays "three nights a week" (no need to name days to sell).

Rejected: global Mon/Wed/Fri + instant story 1 — the first story becomes an
exception that doesn't fit the recurring weekday rhythm (a hitch at the start).
Per-user makes story 1 *the* anchor, so tonight and the recurring trio are the
same thing.

## Still open / to lock
- **Delivery days** — RESOLVED above (per-user anchored; no global weekdays).
- **Story-email footer weekday** — small pending Edge Function polish (above).
- **Rotate `CRON_SECRET`** before launch (shared in chat during testing).
- **Physical mailing address** (Phase 6): placeholder `[123 Example Street…]`
  still in the email footers (CAN-SPAM).

---

## Phase 5 — Supporting flows + transactional pages (BUILT)

Token-based, no-login (see "Identity model" above).

### Signed tokens (as built)
- New `src/lib/token.ts`: a token is **`<userId>.<sig>`**, sig =
  base64url(HMAC-SHA256(userId, `UNSUBSCRIBE_TOKEN_SECRET`)), no padding.
  `createToken` / `verifyToken` (constant-time compare). The token *is* the
  credential — no raw guessable id in the URL, no password.
- The **same scheme is reimplemented in the delivery Edge Function** (Deno, Web
  Crypto `crypto.subtle`) so story-email unsubscribe links verify. The two impls
  MUST stay byte-identical (base64url, no `=` padding).
- ⚠️ **`UNSUBSCRIBE_TOKEN_SECRET` must be set in BOTH Vercel and Supabase Edge
  Function secrets** (same value). Until it's set in Supabase, story sends will
  throw when building the unsub link. Generate: `openssl rand -hex 32`.
- Replaced the old placeholder `…/api/unsubscribe?u=<userId>` in the Dodo
  webhook (welcome email) and the Edge Function (story emails) with
  `?token=<signed>`.

### Unsubscribe / resubscribe
- **`GET /api/unsubscribe?token=…`** (`nodejs`): verify → `unsubscribed = true`
  via service-role JS client → **302 redirect to `/unsubscribed?token=…`**
  (carries the token forward). Bad/missing token still lands on `/unsubscribed`
  but flips nothing, so a link-scanner prefetch of a malformed URL is inert. A
  DB error still redirects (optimistic) rather than 500 a clicking reader.
- **`POST /api/resubscribe`** (new — the design's "Light it again" needs a real
  endpoint): verify token → `unsubscribed = false`, returns JSON. The
  `/unsubscribed` page POSTs the token and flips to the "welcome back" state
  in place. No token on the page ⇒ button hidden (graceful), confirmation still
  shown.

### Resend (Svix) webhook — `/api/webhooks/resend` (`nodejs`)
- **Manual Svix verification** (no `svix` dep): HMAC-SHA256 over
  `${svix-id}.${svix-timestamp}.${rawBody}`, key = base64-decoded secret after
  `whsec_`; constant-time compare against each `v1,<sig>` in `svix-signature`;
  ±5-min timestamp window for replay defense. Secret = `RESEND_WEBHOOK_SECRET`.
- `email.bounced` → `bounced = true`; `email.complained` → `complained = true`
  (matched by recipient email in `data.to`). `email.opened` → stamp
  `delivery_history.opened_at` (matched by `data.email_id` = `resend_id`, first
  open only). Everything else acked with 200.

### Schema change (this phase)
- Added `users.bounced` + `users.complained` (`boolean NOT NULL DEFAULT false`)
  — the bounce/complaint flags are distinct from a voluntary `unsubscribed`.
  The delivery Edge Function query now also filters
  `.eq("bounced", false).eq("complained", false)` (redeployed, v4). Types
  regenerated.

### Transactional pages — ported from `tx-app.jsx`
- `/unsubscribed` (client, reads `?token`, resubscribe button), `not-found.tsx`
  (404), `loading.tsx` (breathing-lamp Suspense fallback). `/error` was already
  built in Phase 3. All reuse `TxChrome` (Atmosphere/Brand/Footer) +
  `transactional.css`.

### Refunds
- Already handled in the Dodo webhook (`refund.succeeded` → `refunded = true`,
  Phase 3) — no change.

### "Manage delivery" link — DROPPED for launch (decided)
- The `/manage` page is **deferred** (no login; would offer change-timezone /
  pause / progress). Decision: **don't build it now** — instead the
  **"Manage delivery" link was removed entirely from both emails**, leaving only
  **Unsubscribe**. Removed from: `emails/story-template.html`,
  `emails/welcome-template.html`, `render.ts` `buildEmail` (param dropped),
  `lib/welcome-email.ts` (`manageUrl` arg dropped), the Dodo webhook, and
  `scripts/preview-story.ts`. Edge Function redeployed (v6).
- **If/when audience grows → build the full `/manage` page** (signed-token like
  unsubscribe: change delivery timezone, pause/resume, show progress) and
  re-add the link. Until then, a wrong-timezone reader just replies (reaches a
  person) and we fix the one DB field by hand.

### Pre-launch (carried forward)
- `RESEND_WEBHOOK_SECRET` + `UNSUBSCRIBE_TOKEN_SECRET`: **set in Vercel (both)
  and Supabase (the token one). DONE & verified** (unsubscribe round-trip +
  bounce/complaint webhook tested on prod 2026-06-09). `CRON_SECRET` rotated.
- **Mailing address** (CAN-SPAM / CASL): footer placeholder
  `[123 Example Street…]` still in both emails. Owner is an India-based sole
  proprietor; **sourcing a real address (~1–2 days)** — a **home address is an
  acceptable free interim** (fully compliant), swap to a P.O. Box later if the
  owner wants it off public display. ePostBook rejected (see Phase 6). The
  address is only legally required before emailing **real** buyers; the
  placeholder is fine for dev/testing to your own inboxes. India itself has no
  email-footer law (TRAI rules cover SMS/calls; DPDP'23 is data/consent) — but
  the requirement follows the **reader's** country, and the product sells
  globally, so US/Canada readers trigger CAN-SPAM/CASL regardless.
- **Deliverability testing**: deliberately deferred to the **very end** — run
  the *fully finished* welcome + story emails through **mail-tester.com**
  (target ~9–10/10) + seed Gmail/Outlook/iCloud inboxes (placement + light/dark
  render), then Google Postmaster Tools at launch. Do NOT test piecemeal; the
  missing mailing address will dock the score until the line above is resolved.
- Phase 6 site content (SEO basics, FAQ section, Privacy Policy, Terms) —
  to be picked up in Phase 6, not now.

---

## Phase 6 — pre-launch hardening (IN PROGRESS)

The canonical checklist for the final pass before going live.

### Track A — code-only hardening (BUILT 2026-06-11)
Shipped to `master` (commit `5b6aa74`); Vercel auto-deployed. Zero dependencies —
done ahead of the owner-driven items.
- **One-click unsubscribe (RFC 8058).** `/api/unsubscribe` now has a **POST**
  handler (Gmail/Apple Mail's native button POSTs in the background, expects a
  bare 200) alongside the existing GET (visible link → redirect to
  `/unsubscribed`). Both share one `unsubscribe()` helper; token rides the query
  string in both cases. Added `List-Unsubscribe: <…/api/unsubscribe?token=…>` +
  `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers to **both** sends:
  the welcome email (Resend SDK `headers` in the Dodo webhook) and story emails
  (Resend REST `headers` in the delivery Edge Function). **Edge Function
  redeployed v8** (`verify_jwt` stays false — custom CRON_SECRET auth).
- **SEO `robots.txt` + `sitemap.xml`** via typed `app/robots.ts` + `app/sitemap.ts`.
  robots: allow `/`, disallow `/api/` + `/welcome` + `/unsubscribed` + `/error`,
  point to sitemap. sitemap: landing only for now — **add `/privacy` + `/terms`
  here when Track B ships.** (Page-level `<title>`/OG/Twitter were already done.)
- **Error boundaries:** `app/error.tsx` (brand-styled via `TxChrome`, "Try again"
  calls `reset()`; distinct from the payment-failure `/error` page) and
  `app/global-error.tsx` (self-contained inline-styled root fallback for when the
  root layout itself throws — no layout fonts/CSS available there).
- **Story-footer next-weekday personalisation (DONE, commit `89efa50`, Edge fn
  v9):** footer now reads "The next arrives <weekday> at 9 PM" — the Edge
  Function computes the next story's due weekday from purchase date + its 2-2-3
  offset (`nextStoryWeekday`/`weekdayOf`) and passes it to `buildEmail`'s new
  optional `nextWeekday` param (null on the last story → generic fallback).
- Verified: `tsc --noEmit` clean + `next build` green (robots/sitemap emit as
  static routes); local `preview-story.ts` renders the personalised footer.

### Track B — site content (BUILT 2026-06-11, commit `91ad972`)
Shipped to `master`; Vercel auto-deployed. Verified in preview (no console
errors; both legal pages + FAQ render on-brand).
- **FAQ landing section** (`src/components/Faq.tsx`) — NEW copy (no mock
  counterpart; drafted in brand voice and **approved by owner for review**). 8
  Q&As as a native `<details>/<summary>` accordion (no JS, accessible) with a
  +/− toggle; emits **FAQPage JSON-LD** for rich results. Wired into `page.tsx`
  after `WhosBehind` as `id="faq"` (dark; alternation preserved). Styles added to
  `landing.css`. Landing copy stays "three nights a week" (days not named).
- **Privacy Policy `/privacy` + Terms `/terms`** — long-form legal pages via a
  shared `LegalPage` chrome (`src/components/LegalPage.tsx`, reuses TxChrome
  `Atmosphere`/`Brand`) + new `src/styles/legal.css`. Per-page `metadata`
  (title/description). **Owner-confirmed facts baked in:** seller = "Still at
  Nine, operated by **Aayush** (sole proprietor)", Ranchi, Jharkhand, India;
  contact `hello@stillatnine.com`; **Dodo = merchant of record**;
  sub-processors **Resend / Supabase / Vercel** (named); **7-day refund** on
  request; no data resale; **governing law India, courts at Ranchi**; effective
  date 11 June 2026; 18+ / DPDP-aware. ⚠️ **NOT legal advice — drafts for owner
  review.** The footer mailing address is a marked placeholder
  `[Mailing address — to be added]` pending the P.O. Box (same blocker as the
  email templates).
  - Owner decision on identity: full legal surname **not** used — first name
    "Aayush" + brand + contact email is the agreed identifier (sole proprietor).
    Can add a fuller legal name / social link later if desired.
- **Footer**: added Privacy / Terms / Contact(mailto) links + styles
  (`Footer.tsx`, `landing.css`). **`/privacy` + `/terms` added to
  `sitemap.ts`** (the Track-A TODO).
- **SEO basics now essentially complete**: `<title>`/description + OG/Twitter
  (Phase-1 layout), robots + sitemap (Track A), semantic headings, FAQ JSON-LD.
  Still optional: **font preloading** (fonts load via stylesheet `<link>`, not
  `<link rel=preload>`) — minor, deferred.

### Mailing address (blocker for emails)
- Get a physical postal address for the email footer (CAN-SPAM / CASL). Owner is
  an India-based sole proprietor, no office. Needs one of: a street address, a
  **P.O. Box registered with the postal service**, or a **CMRA** mailbox.
- ⚠️ **ePostBook (epostbook.com) was investigated and REJECTED.** Despite the
  "Unique Postal Address" marketing, the actual product is a **digital "PostBox
  ID"** (e.g. "PostBox ID 1000") + a forwarding service — you give out the ID and
  confirm a real address for them to forward to. It is NOT a standalone,
  India-Post-deliverable street/PIN address, so it does not cleanly satisfy the
  "valid physical postal address" requirement.
- **Recommended: an India Post P.O. Box** (Post Box / Post Bag at a Head Post
  Office), format "Post Box No. 123, [HPO], [City] – [PIN], India", ~₹1–2.5k/yr —
  unambiguously a registered P.O. Box. A virtual office / CMRA with a real
  street+PIN address also works (pricier).
- Then replace the `[123 Example Street, City, Country]` placeholder in **both**
  `emails/story-template.html` and `emails/welcome-template.html`, and keep the
  box renewed (the address lives in inboxes for months).

### Deliverability testing (do LAST — only once emails are fully finished)
Do not test piecemeal; send the *finished* emails. Order:
1. **mail-tester.com** (free, first) — it gives a one-time address; send the
   welcome email AND a story email to it. Returns a 0–10 score + exactly what's
   wrong: SPF/DKIM/DMARC alignment, spammy content, and **the missing physical
   address** (so the mailing-address item above must be done first). Fix until
   ~9–10/10.
2. **Seed inboxes you control** — send to a **Gmail**, an **Outlook/Hotmail**,
   and an **Apple iCloud** account. Per inbox check: (a) Inbox vs Promotions vs
   Spam, (b) renders correctly, (c) **dark mode** renders (open in Apple Mail
   dark + Gmail app dark — the template has dark-mode hooks to verify).
3. **Google Postmaster Tools** — set up at/after launch to watch domain
   reputation + spam-complaint rate once there's real volume.
- Note: SPF/DKIM/DMARC + verified Resend domain were already done in Phase 0, so
  this is mostly verification. The **address (above)** and **unsubscribe link
  (done)** are direct inputs to the spam score — deliverability and the legal
  footer are the same fight. Quick version: mail-tester + 3 seed inboxes catches
  ~95% of issues.

### Site content — ✅ BUILT in Track B (above); detail kept for reference
- **Privacy Policy** + **Terms** pages (`/privacy`, `/terms`) — DONE (Track B).
  Tailored to: no accounts, email + timezone only, Dodo as Merchant of Record,
  Resend + Supabase (+ Vercel) sub-processors, 7-day refund, no data resale.
  (Not legal advice; drafts to be reviewed; mailing address still placeholder.)
- **FAQ** — landing section — DONE (Track B; 8 Q&As + FAQPage JSON-LD).
- **SEO basics** — `<title>` + meta description, OG/Twitter tags (Phase 1),
  `robots.txt` + `sitemap.xml` (Track A), semantic headings + FAQ JSON-LD
  (Track B). **Remaining: font preloading only** (optional).

### Email headers & one-click unsubscribe (NEW — not built)
- **`List-Unsubscribe` + `List-Unsubscribe-Post` headers** are NOT set yet. Today
  the emails only carry a *visible* Unsubscribe link. Gmail/Yahoo bulk-sender
  rules (Feb 2024) want **one-click unsubscribe (RFC 8058)** for senders
  >5,000/day; below that it's strongly recommended and helps inbox placement.
  - Add the headers to both sends: the Edge Function `fetch` to Resend (story
    emails) and the Dodo-webhook welcome send, e.g.
    `List-Unsubscribe: <https://stillatnine.com/api/unsubscribe?token=…>` and
    `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
  - One-click sends an HTTP **POST** to that URL, but `/api/unsubscribe` is
    **GET-only** today → **add a POST handler** (same token verify → set
    `unsubscribed = true`, return 200). Keep the GET for the visible link.
- **GET-unsubscribe prefetch hardening (consider):** the visible link is a GET
  that mutates. Aggressive corporate **email security scanners can pre-click**
  links and unsubscribe someone who never clicked. Mitigations to weigh: rely on
  the `List-Unsubscribe-Post` (POST) path as the primary mechanism, and/or add a
  lightweight confirm step on the visible link. Low probability at this audience;
  documented so it's a conscious choice.

### Other pre-launch
- Error boundary, Lighthouse pass.
- **Switch Dodo to live mode** (live product IDs + checkout host) then
  **redeploy** (`NEXT_PUBLIC_DODO_*` are baked at build time).
- **Wipe test data** (test purchases + their `delivery_history`; e.g. the
  `aayush11aug@gmail.com` test account).
- Seed stories **3–24** (only 1 & 2 exist) — without them, delivery stalls after
  story 2. This is the main *content* gate; pipeline already exists
  (`content/README.md` → `content/structuring-agent.md` → `scripts/import-story.ts`).
- Optional polish: personalise story-email footer "The next arrives **Thursday**
  at 9 PM" (small Edge Function change).
- **Keep cron-job.org enabled** — delivery only runs while it POSTs the Edge
  Function every 15 min. (Story 1 & 2 verified delivering at 9 PM local.)

---

## Phase 7 — Marketing funnel (launch-reference.md Part 3)

The free-email funnel layered on top of the paid product: homepage modals →
email capture → 2 free stories → 1 pitch → occasional emails, all at 9 PM
subscriber-local. Buyers stay in `users`; the funnel adds a parallel
`subscribers` world that *graduates* into `users` on purchase.

### Section A — schema + capture + cron (BUILT & DEPLOYED 2026-06-13)

**New tables (additive — paid delivery untouched):**
- **`subscribers`** — free captures: `email` (unique, lowercased), `timezone`
  (browser Intl), `currency` (geo at signup), `status`
  (`free_sequence|pitched|dormant|purchased|unsubscribed`), `funnel_step`
  (0=pre #1, 1=pre #2, 2=pre pitch, 3=dormant/occasional), `next_send_at`
  (UTC instant of the next 9 PM-local send), `signup_source`, `bounced`,
  `complained`. RLS on, no policies (service-role only).
- **`story_sends`** — per-subscriber ledger (dedupe + retry, mirrors
  `delivery_history`): `subscriber_id`, `story_number` (null for the pitch),
  `type` (`free|paid|occasional|pitch`), `resend_id`, `status`,
  `failure_count`.
- **`stories`** gained `slug` (unique), `pool` (`A|B|C`), `sequence_position`
  for Section B pages + Section D content. **Provisional test assignment:**
  story 1 → Pool B + slug `the-grave-that-shouldnt-exist`, story 2 → Pool A
  (`the-cias-last-code`). Section D finalizes the real Pool B trio.

**Cron — extended the existing `deliver-stories` Edge Function** (NOT a second
function/cron job — reuses the same 15-min cron-job.org tick + `CRON_SECRET`).
After the buyer loop it runs `processFunnel()` (`funnel.ts`): selects
subscribers whose `next_send_at <= now` and not bounced/complained, then per
subscriber re-checks purchase (race guard) and advances one step. Edge fn **v10**.
- **Late-signup immediate send:** `/api/subscribe` sets `next_send_at = now` when
  the signup falls in the 8:30 PM–1:59 AM local window → the next cron tick
  (≤15 min) sends story #1 ("you're just in time"). Otherwise `next_send_at` =
  9 PM local today (`localWallToUtc` fixpoint on the tz offset).
- **Purchase exits instantly + re-check at send time:** the Dodo webhook
  graduates a converting subscriber (below), AND `processFunnel` re-queries
  `users` by email before every send → flips `status='purchased'`, no send.
  Both verified live (a buyer-email subscriber flipped to purchased, 0 sends).
- **Dedupe:** `story_sends` per subscriber; `pickStory` excludes already-sent
  numbers. Retry mirrors the buyer path (status `failed` → 3 → `abandoned`,
  then advance so the sequence never stalls).
- **Step timing:** #1 → +3 nights → #2 → +2 nights → pitch → +5 weeks →
  occasional (repeats every ~5 weeks). All at 9 PM local.

**Buyer dedupe — the "playlist" model (changes paid delivery, backward-compatible):**
- `deliver-stories` no longer sends `story_number = current_story + 1`. It builds
  a **playlist** = `1..24` minus stories in `delivery_history` with status in
  (`sent`,`abandoned`,`free_carryover`) and sends `playlist[0]`. `current_story`
  now counts **paid slots completed** (drives the 2-2-3 schedule via
  `dayOffset(slot)`), not the highest story number. For a pure buyer
  `playlist[0] === current_story+1`, so behavior is identical (verified the live
  buyer still no-ops correctly).
- **Graduation (Dodo webhook):** on first creation, look up the subscriber by
  email; pre-seed `delivery_history` with `status='free_carryover'` rows for each
  collection story (1..24) they read free, and set `subscribers.status='purchased'`.
  Carry-over rows are excluded from the playlist (no duplicate) but DON'T count as
  a paid slot, so "first story tonight" still holds. New footer flag `isLast` (a
  graduated buyer's last paid story may be #23, not #24).

**Tokens (`src/lib/token.ts` + mirrored in `funnel.ts`):** buyer tokens
`<userId>.<sig>` are frozen (already live in sent mail); subscriber tokens are
`sub.<id>.<sig>` (the `sub.` prefix is part of the signed payload, so a buyer
token can't be replayed as a subscriber one). `/api/unsubscribe` +
`/api/resubscribe` route by audience via `verifyAnyToken`. Subscriber
unsubscribe → `status='unsubscribed'`; resubscribe → `status='dormant'`
(rejoins occasional, ~5 weeks out). The Resend bounce/complaint webhook now
flags both `users` and `subscribers`.

**Email templates (`render.ts`):** one story template, footer variants
`paid|free_soft|free_firm|occasional|pitch` + masthead badge ("Story N/24" vs
"A free story"). Footer copy verbatim from the doc (soft/firm). New
`buildPitchEmail()` (Archivist voice, named locked hooks, price+anchor, one
button, honest "first story tonight if you join before nine" urgency). **Pitch
marketing copy is a DRAFT for owner review** (Part 5 open item "write together").
Email buy links carry `?src=free1/free2/pitch/occasional` (Section C UTM).

**Frontend (`CaptureForm.tsx` + `StoriesSection.tsx`):** preview modals now lead
with the email capture (primary, amber "Read it in full tonight — free") above a
ghost secondary buy button; captures `email` + browser `timezone` + `source`
(`modal-<num>`) to `/api/subscribe`. On-brand confirmation states
("It's coming tonight at nine." / "You're just in time."). Verified in preview.

### Section A — still open for the owner
- **Pool B not finalized** — only story 1 is provisionally Pool B. The funnel
  needs ≥2 Pool B stories assigned (Section D) to send free #1 AND #2; with one,
  it sends #1 then jumps to the pitch (graceful).
- The funnel reuses the same Resend/CRON/TOKEN secrets already set in Supabase —
  no new Edge Function secrets required.

## Parked / deferred (decided NOT to do now — revisit later)

Conscious "not now" calls, so a future session doesn't rebuild them by mistake:

- **Email open & click tracking** — revisit later (not now). Requires a verified
  **tracking subdomain** `links.stillatnine.com` (+ a CNAME in Cloudflare);
  Resend serves the open-pixel *and* click-redirects through it. Note: the
  dashboard's "New tracking subdomain" wizard **forces click tracking on** to
  create the subdomain — to run open-only you'd create it (click checked), verify
  DNS, then toggle click off in Configuration (or via API `openTracking:true,
  clickTracking:false`). Caveats: open numbers are inaccurate (Apple Mail Privacy
  Protection / image proxies); click tracking **wraps every link incl.
  Unsubscribe** through the subdomain. The `email.opened` → `opened_at` webhook
  handler is already built and will populate once tracking is enabled.
- **`/manage` page** — deferred until audience grows (see Phase 5 section). Link
  already removed from emails; a wrong-timezone reader replies and we fix the DB
  field by hand for now.
- **Full timezone self-service / pause** — part of the future `/manage` page.
