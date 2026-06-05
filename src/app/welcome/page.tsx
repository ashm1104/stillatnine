"use client";

// Thank-you page (ported from design-reference/tx-app.jsx — ThankYou).
//
// On mount it captures the reader's timezone (delivery is scheduled 9 PM
// reader-local) and saves it against their dodo_payment_id, which Dodo appends
// to this URL on redirect. The webhook may still be creating the user row, so
// set-timezone returns 202 until it exists and we retry a few times.

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { displayForCurrency } from "@/lib/pricing";
import "@/styles/transactional.css";

const AC = "#D8A24C";

/* ---- atmosphere (ported from the landing page) ---- */
function Atmosphere({ level = "subtle" }: { level?: "none" | "subtle" | "full" }) {
  const s = level === "none" ? 0 : level === "full" ? 0.85 : 0.5;
  if (s === 0) return null;
  const embers: [number, number, number, number][] = [
    [85, 78, 2.4, 0.8], [80, 70, 1.5, 0.55], [88, 60, 1.8, 0.65], [78, 82, 1.3, 0.45],
    [72, 68, 1.7, 0.5], [82, 48, 1.2, 0.4], [74, 80, 2.0, 0.6], [68, 76, 1.3, 0.38],
    [90, 72, 1.4, 0.5], [64, 64, 1.1, 0.34], [58, 72, 1.5, 0.42], [50, 60, 1.0, 0.3],
  ];
  return (
    <div className="atmo" aria-hidden="true">
      <div
        className="atmo-glow"
        style={{
          background: `radial-gradient(100% 80% at 50% 108%, rgba(216,162,76,${0.26 * s}) 0%, rgba(216,162,76,${0.06 * s}) 34%, transparent 62%)`,
        }}
      />
      <svg className="atmo-arcs" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[30, 46, 64].map((r, i) => (
          <circle key={i} cx="50" cy="108" r={r} fill="none" stroke={AC} strokeWidth="0.12" opacity={(0.12 - i * 0.03) * s} />
        ))}
      </svg>
      <svg className="atmo-embers" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {embers.map(([x, y, r, o], i) => (
          <g key={i}>
            {r > 1.5 && (
              <circle cx={x} cy={y} r={r * 2.5} fill={AC} className="ember" opacity={o * 0.1 * s} style={{ animationDelay: `${(i % 10) * 0.7}s`, animationDuration: `${6 + (i % 6)}s` }} />
            )}
            <circle cx={x} cy={y} r={r * 0.5} fill={AC} className="ember" opacity={o * s} style={{ animationDelay: `${(i % 8) * 0.6}s`, animationDuration: `${5 + (i % 5)}s` }} />
          </g>
        ))}
      </svg>
      <div className="atmo-nine" style={{ opacity: 0.018 * s, left: "auto", right: "50%", transform: "translateX(50%)", bottom: "-8%" }}>9</div>
      <div className="atmo-vig" style={{ opacity: s * 0.9 }} />
      <div className="grain" style={{ opacity: 0.045 * s }} />
    </div>
  );
}

function Brand() {
  return (
    <a className="tx-brand" href="/">
      <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%", background: AC, boxShadow: "0 0 16px 3px rgba(216,162,76,0.45)" }} />
      <span className="tx-brand-name">Still at Nine</span>
    </a>
  );
}

function Footer() {
  return (
    <footer className="tx-footer">
      <p>© 2026 Still at Nine · Stories after dark</p>
    </footer>
  );
}

function ThankYou({ currency }: { currency?: string | null }) {
  const { price, anchor } = displayForCurrency(currency);

  return (
    <div className="tx-page">
      <Atmosphere level="subtle" />
      <Brand />
      <main className="tx-main">
        <div className="tx-inner tx-inner--wide">
          <div className="tx-lamp"><span className="tx-dot" /></div>
          <div className="tx-eyebrow">Order confirmed</div>
          <h1 className="tx-title">You&rsquo;re in.</h1>
          <div className="tx-underscore" />
          <p className="tx-tagline">The lamp is lit. Your first story arrives tonight at 9.</p>

          <div className="tx-card">
            <div className="tx-card-head">
              <div>
                <h2 className="tx-card-title">Still at Nine &mdash; The Collection</h2>
                <p className="tx-card-sub">24 stories · 8 weeks · delivered 9 PM</p>
              </div>
              <div className="tx-card-paid">
                {currency ? (
                  <span className="tx-card-amount">
                    <span className="tx-card-strike">{anchor}</span>
                    {price}
                  </span>
                ) : (
                  // Until the order resolves, show a neutral placeholder rather
                  // than risk flashing the wrong currency.
                  <span className="tx-card-amount" style={{ opacity: 0.35 }}>·</span>
                )}
                <span>Paid · one time</span>
              </div>
            </div>
            <ul className="tx-steps">
              <li className="tx-step">
                <span className="tx-step-ic">1</span>
                <span className="tx-step-txt">Your first story lands <b>tonight at 9 PM</b>, then three nights a week.</span>
              </li>
              <li className="tx-step">
                <span className="tx-step-ic">2</span>
                <span className="tx-step-txt">Add <b>stories@stillatnine.com</b> to your contacts so it always reaches you.</span>
              </li>
              <li className="tx-step">
                <span className="tx-step-ic">3</span>
                <span className="tx-step-txt">Reply to any story anytime &mdash; it reaches a person, not a void.</span>
              </li>
            </ul>
          </div>

          <p className="tx-note">A receipt is on its way to your inbox. Nothing to download, nothing to log into.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/**
 * Saves the timezone against the payment_id from the URL, and reports back the
 * order's currency so the receipt shows the right price. Retries while the
 * webhook is still creating the user row.
 */
function useCaptureTimezone(onCurrency: (currency: string) => void) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentId = searchParams.get("payment_id");
    if (!paymentId) return; // can't identify the buyer — nothing to save

    let tz = "";
    try {
      tz = localStorage.getItem("san_timezone") || "";
    } catch {
      /* localStorage blocked — fall through to the live Intl value */
    }
    if (!tz) {
      try {
        tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      } catch {
        /* Intl unavailable */
      }
    }
    if (!tz) return;

    let cancelled = false;
    const MAX_ATTEMPTS = 6;
    const RETRY_MS = 1500;

    (async () => {
      for (let attempt = 0; attempt < MAX_ATTEMPTS && !cancelled; attempt++) {
        try {
          const res = await fetch("/api/set-timezone", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ paymentId, timezone: tz }),
          });
          if (res.status === 200) {
            const body = await res.json().catch(() => null);
            if (body?.currency && !cancelled) onCurrency(body.currency);
            return; // saved
          }
          if (res.status === 400 || res.status === 401) return; // won't fix on retry
          // 202 (row not created yet) or 5xx -> wait and retry
        } catch {
          /* network hiccup — retry */
        }
        await new Promise((r) => setTimeout(r, RETRY_MS));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, onCurrency]);
}

function WelcomeClient() {
  const [currency, setCurrency] = useState<string | null>(null);
  useCaptureTimezone(setCurrency);
  return <ThankYou currency={currency} />;
}

export default function WelcomePage() {
  // useSearchParams must sit inside a Suspense boundary.
  return (
    <Suspense fallback={<ThankYou />}>
      <WelcomeClient />
    </Suspense>
  );
}
