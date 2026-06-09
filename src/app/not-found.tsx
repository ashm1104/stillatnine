// 404 (ported from design-reference/tx-app.jsx — NotFound). Next.js renders
// this for unmatched routes and notFound() calls.

import { Atmosphere, Brand, Footer } from "@/components/TxChrome";
import "@/styles/transactional.css";

export default function NotFound() {
  return (
    <div className="tx-page">
      <Atmosphere level="subtle" />
      <Brand />
      <main className="tx-main">
        <div className="tx-inner">
          <div className="tx-404">4<span className="nine-dot">0</span>4</div>
          <div className="tx-eyebrow tx-eyebrow--mute" style={{ marginTop: 8 }}>Nothing here</div>
          <h1 className="tx-title">This page went dark.</h1>
          <div className="tx-underscore" />
          <p className="tx-tagline">The story you&rsquo;re after isn&rsquo;t here &mdash; or the light&rsquo;s gone out on this link.</p>
          <div className="tx-rule"><div /><span>&#10022;</span><div /></div>
          <div className="tx-actions">
            <a className="tx-cta" href="/">Back to Still at Nine</a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
