# Still at Nine — Project Context

## What this is
A premium after-dark mystery email product. One-time purchase
($19 / ₹499 India), 24 stories over 8 weeks, delivered at 9 PM
in the reader's timezone.

## Tech stack
- Next.js (App Router) on Vercel
- Supabase (Postgres + Edge Functions) — accessible via MCP
- Resend (transactional email API)
- Dodo Payments (payment processing, Merchant of Record)
- cron-job.org → Supabase Edge Function (delivery scheduler)
- GitHub — repo at github.com/ashm1104/stillatnine (use git CLI)

## MCP access
You have MCP access to Supabase only. (GitHub MCP is NOT connected.)
- Supabase MCP for all database operations (create tables,
  run SQL, deploy Edge Functions, generate types)
- Do not generate migration SQL files — execute directly via MCP.

## Git
GitHub MCP is not wired up — use the git CLI directly. Workflow:
commit straight to `master`; Vercel auto-deploys on push. Do not
ask the user to run git commands — run them yourself.

## Two reference docs — know which to consult

### `/design-reference/HANDOFF.md` — DESIGN only
Consult for: components, visual structure, assets, styles,
tokens, fonts, copy, atmosphere, logo usage, email template
structure, image paths, CSS classes.
Does NOT contain: database schema, API logic, delivery logic,
payment flow, environment variables, or any backend specs.

### `/tech-build-plan.md` — TECH only (NOTE: gitignored, local-only)
Consult for: database schema (tables, columns, types, indexes),
API routes, Edge Function logic, payment flow, webhook handling,
delivery logic, retry/failure handling, environment variables,
timezone capture, geo-pricing implementation, project structure.
This is the canonical source for all backend decisions.

### `/DECISIONS.md` — AS-BUILT decisions (committed)
Consult for anything decided/resolved during the build that the plan
didn't pin down: Dodo redirect params, webhook spec, checkout
test/live hosts, env-var names, no-accounts/token-link model, DNS.
When a build choice contradicts tech-build-plan.md, DECISIONS.md wins.

## Design reference files (port to Next.js, match exactly)
- `/design-reference/lp-app.jsx` — landing page mock
- `/design-reference/tx-app.jsx` — transactional pages mock
- `/design-reference/email-template.jsx` — story email component structure
- `/design-reference/email-data.jsx` — sample story data shape (defines
  content_blocks JSON format used in database and email assembly)
- `/design-reference/welcome-template.jsx` — welcome email structure

## Production files (use directly, do not modify structure)
- `/src/styles/tokens.css` — canonical design tokens (`--san-*`).
  NEVER invent new colors or tokens.
- `/emails/story-template.html` — send-ready story email HTML.
  Only replace placeholders at runtime.
- `/emails/welcome-template.html` — send-ready welcome email HTML.
  Only replace placeholders at runtime.

## Design rules (non-negotiable)
1. Colors: only tokens from tokens.css. Amber #D8A24C is the
   sole accent. Never add a second hue.
2. Fonts: Playfair Display (headings) + Spectral (body)
   + Spectral SC (labels). Georgia fallback.
3. Copy: verbatim from the JSX mocks. Do not rewrite.
4. Atmosphere: port existing CSS from lp-app.jsx.
   Do not hand-roll new effects.
5. Email HTML: keep table layout, inline styles, and
   dark-mode hooks intact.
6. If something is missing, ASK — do not improvise.

## Landing page config
heroLayout: 'cinematic' · sectionStyle: 'alternating' ·
storyCards: 'archive' · atmosphere: 'rich'

## Quick tech reference (details in tech-build-plan.md)

### Database — 3 tables
- **stories**: story_number (1-24), title, content_blocks (jsonb),
  sources (jsonb), subject_line, preheader, status
- **users**: email, timezone, currency, amount_paid,
  dodo_payment_id, current_story (int, tracks progress),
  refunded, unsubscribed
- **delivery_history**: user_id, story_number, resend_id,
  status (sent/failed/abandoned), failure_count

Fixed sequence: all buyers get stories 1-24 in the same order.
Timezone captured on thank-you page after payment.

### Delivery logic
Edge Function runs every 15 min via cron. For each eligible
user: check if 9 PM in their timezone is now (±7 min), check
delivery day (Mon/Wed/Fri), check no duplicate, fetch story,
assemble email from template, send via Resend, log result.
3 failures → abandon. Skip refunded/unsubscribed.

### Payment flow
CTA → save timezone to localStorage → redirect to Dodo hosted
checkout → Dodo webhook creates user in Supabase → welcome email
via Resend → user lands on /welcome → timezone captured from
browser API and saved to user record.

### Geo-pricing
Server component reads Vercel request.geo.country.
India → ₹499 (~~₹799~~) + India product ID.
All others → $19 (~~$24~~) + Global product ID.