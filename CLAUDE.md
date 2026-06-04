# Still at Nine — Project Context

## What this is
A premium after-dark mystery email product. One-time purchase
($19 / ₹499 India), 24 stories over 8 weeks, delivered at 9 PM
in the reader's timezone.

## Tech stack
- Next.js (App Router) on Vercel
- Supabase (Postgres + Edge Functions)
- Resend (transactional email API)
- Dodo Payments (payment processing, Merchant of Record)
- cron-job.org → Supabase Edge Function (delivery scheduler)

## Key files
- `/design-reference/HANDOFF.md` — master design handoff, maps
  every asset and component. READ THIS FIRST for any design question.
- `/design-reference/lp-app.jsx` — landing page reference
  implementation. Port to Next.js components. Match exactly.
- `/design-reference/tx-app.jsx` — transactional pages reference.
- `/src/styles/tokens.css` — canonical design tokens (`--san-*`).
  Import everywhere. NEVER invent new colors or tokens.
- `/emails/story-template.html` — production email HTML. Do not
  modify the HTML structure or inline styles.
- `/emails/welcome-template.html` — production welcome email HTML.

## Design rules (non-negotiable)
1. Colors: only tokens from tokens.css. Amber #D8A24C is the
   sole accent. Never introduce a second hue.
2. Fonts: Playfair Display (headings, 600) + Spectral (body, 400)
   + Spectral SC (labels, 500). Georgia fallback.
3. Copy: reuse locked copy verbatim from the JSX mocks.
   Do not rewrite, rephrase, or "improve" any copy.
4. Atmosphere: port the existing CSS/components from lp-app.jsx.
   Do not hand-roll new glow/grain effects.
5. Logo: render via components or use provided PNGs. Never redraw.
6. Email HTML: keep table layout, inline styles, preheader div,
   and .es-* dark-mode hooks. Never strip them.
7. No new UI patterns. Match the existing restrained, editorial
   design system.
8. If an asset or spec is missing, ASK — do not improvise.

## Landing page config (defaults)
heroLayout: 'cinematic' · sectionStyle: 'alternating' ·
storyCards: 'archive' · atmosphere: 'rich'

## Environment variables
See .env.example for the full list. Never hardcode keys.

## Database
Supabase Postgres. Tables: stories, users, delivery_history.
Fixed story sequence (1-24), same for all users.
Timezone captured on thank-you page after payment.

## Delivery logic
Edge Function runs every 15 min via cron. Checks timezone,
sends next story via Resend, logs to delivery_history.
3 failures → abandon. Skip refunded/unsubscribed users.