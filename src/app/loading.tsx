// Route-transition fallback (ported from design-reference/tx-app.jsx —
// Loading). The breathing lamp shown while a server component streams in.

import { Atmosphere, Brand } from "@/components/TxChrome";
import "@/styles/transactional.css";

export default function Loading() {
  return (
    <div className="tx-page">
      <Atmosphere level="subtle" />
      <Brand />
      <main className="tx-main">
        <div className="tx-inner">
          <div className="tx-loader">
            <div style={{ position: "relative", width: 18, height: 18 }}>
              <span className="tx-loader-halo" />
              <span className="tx-loader-lamp" />
            </div>
            <div className="tx-loader-text">One moment</div>
            <div className="tx-loader-sub">Finding your place in the dark&hellip;</div>
            <div className="tx-progress" />
          </div>
        </div>
      </main>
    </div>
  );
}
