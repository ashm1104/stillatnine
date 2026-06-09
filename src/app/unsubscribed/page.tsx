"use client";

// Unsubscribe confirmation (ported from design-reference/tx-app.jsx —
// Unsubscribe). /api/unsubscribe redirects here with the signed token, so the
// "Light it again" button can re-light the lamp without a login. Reached
// without a token (e.g. a stale bookmark), it still confirms the unsubscribe —
// it just hides the resubscribe button, since there's no one to resubscribe.

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Atmosphere, Brand, Footer } from "@/components/TxChrome";
import "@/styles/transactional.css";

function Unsubscribed({ token }: { token: string | null }) {
  const [resubbed, setResubbed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function relight() {
    if (!token || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch("/api/resubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) setResubbed(true);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tx-page">
      <Atmosphere level="subtle" />
      <Brand />
      <main className="tx-main">
        <div className="tx-inner">
          <div className="tx-lamp"><span className={"tx-dot" + (resubbed ? "" : " tx-dot--out")} /></div>
          {resubbed ? (
            <>
              <div className="tx-eyebrow">Welcome back</div>
              <h1 className="tx-title">The lamp is lit again.</h1>
              <div className="tx-underscore" />
              <p className="tx-tagline">Good. The stories resume at the next nine o&rsquo;clock.</p>
              <div className="tx-actions">
                <a className="tx-cta" href="/">Back to Still at Nine</a>
              </div>
            </>
          ) : (
            <>
              <div className="tx-eyebrow tx-eyebrow--mute">Unsubscribed</div>
              <h1 className="tx-title">The lamp is out.</h1>
              <div className="tx-underscore tx-underscore--out" />
              <p className="tx-tagline">You&rsquo;ve been unsubscribed. No more stories will arrive at nine.</p>
              <p className="tx-body">The stories already in your inbox are yours to keep. If this was a quiet evening&rsquo;s mistake, you can light it again.</p>
              <div className="tx-actions">
                {token && (
                  <button className={"tx-cta" + (busy ? " tx-cta--busy" : "")} onClick={relight} disabled={busy}>
                    {busy ? (<><span className="tx-spin" />Lighting&hellip;</>) : "Light it again"}
                  </button>
                )}
                <a className="tx-link" href="/">Return to Still at Nine instead &rsaquo;</a>
              </div>
              {failed && (
                <p className="tx-help">
                  That didn&rsquo;t take. Write to <a href="mailto:hello@stillatnine.com">hello@stillatnine.com</a> and we&rsquo;ll light it for you.
                </p>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function UnsubscribedClient() {
  const token = useSearchParams().get("token");
  return <Unsubscribed token={token} />;
}

export default function UnsubscribedPage() {
  // useSearchParams must sit inside a Suspense boundary.
  return (
    <Suspense fallback={<Unsubscribed token={null} />}>
      <UnsubscribedClient />
    </Suspense>
  );
}
