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

## Still open / to lock
- **Delivery days** (Phase 4): plan recommends **Mon/Wed/Fri** — confirm before
  building the schedule logic.
- **Physical mailing address** (Phase 6): placeholder `[123 Example Street…]`
  still in the email footers (CAN-SPAM).
