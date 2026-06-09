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

### Still deferred (NOT built — were never in this task's scope)
- `/manage?token=…` page (change timezone / pause). Story & welcome emails'
  **"Manage delivery"** link still points at `…/manage?u=<userId>` (Edge) /
  `/welcome` (welcome email) and 404s — build when /manage lands.
- `RESEND_WEBHOOK_SECRET` + `UNSUBSCRIBE_TOKEN_SECRET` must be added in
  Vercel (both) and Supabase (the token one) before launch.
