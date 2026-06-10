"use client";

// Route-level error boundary. Catches unexpected runtime errors in any page
// (anything below the root layout) and shows a brand-styled recovery screen
// instead of a raw stack trace. Distinct from /error, which is the *payment*
// failure page reached by redirect.

import { useEffect } from "react";
import { Atmosphere, Brand, Footer } from "@/components/TxChrome";
import "@/styles/transactional.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest correlates with the server log entry for this error.
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="tx-page">
      <Atmosphere level="subtle" />
      <Brand />
      <main className="tx-main">
        <div className="tx-inner">
          <div className="tx-lamp"><span className="tx-dot tx-dot--flicker" /></div>
          <div className="tx-eyebrow tx-eyebrow--mute">Something went wrong</div>
          <h1 className="tx-title">The lamp went out.</h1>
          <div className="tx-underscore" />
          <p className="tx-tagline">An unexpected error interrupted things on our end.</p>
          <p className="tx-body">It&rsquo;s not you. Try again in a moment &mdash; and if it keeps happening, write to us and we&rsquo;ll look into it.</p>
          <div className="tx-actions">
            <button className="tx-cta" type="button" onClick={() => reset()}>Try again</button>
            <a className="tx-link" href="/">Return to Still at Nine instead &rsaquo;</a>
          </div>
          <p className="tx-help">Still stuck? Write to <a href="mailto:hello@stillatnine.com">hello@stillatnine.com</a> &mdash; it reaches a person.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
