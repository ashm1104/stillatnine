"use client";

// Payment error / cancel page (ported from design-reference/tx-app.jsx —
// ErrorState). Dodo's cancel/failure redirect lands here, and /welcome also
// forwards here when the redirect status isn't "succeeded". No charge happens
// on a failed payment, so there's nothing to undo — just a way back.

import { Atmosphere, Brand, Footer } from "@/components/TxChrome";
import "@/styles/transactional.css";

export default function ErrorPage() {
  return (
    <div className="tx-page">
      <Atmosphere level="subtle" />
      <Brand />
      <main className="tx-main">
        <div className="tx-inner">
          <div className="tx-lamp"><span className="tx-dot tx-dot--flicker" /></div>
          <div className="tx-eyebrow tx-eyebrow--mute">Something went wrong</div>
          <h1 className="tx-title">The light flickered.</h1>
          <div className="tx-underscore" />
          <p className="tx-tagline">Your payment didn&rsquo;t go through &mdash; and nothing was charged.</p>
          <p className="tx-body">It happens. Try once more, or write to us and we&rsquo;ll light the way. If a charge ever appears, it reverses on its own within a few days.</p>
          <div className="tx-actions">
            <a className="tx-cta" href="/">Try again</a>
            <a className="tx-link" href="/">Return to Still at Nine instead &rsaquo;</a>
          </div>
          <p className="tx-help">Stuck? Write to <a href="mailto:hello@stillatnine.com">hello@stillatnine.com</a> &mdash; it reaches a person.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
