"use client";

// Thank-you page (ported from design-reference/tx-app.jsx — ThankYou).
//
// On mount it captures the reader's timezone (delivery is scheduled 9 PM
// reader-local) and saves it against their dodo_payment_id, which Dodo appends
// to this URL on redirect. The webhook may still be creating the user row, so
// set-timezone returns 202 until it exists and we retry a few times.

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { displayForCurrency } from "@/lib/pricing";
import { Atmosphere, Brand, Footer } from "@/components/TxChrome";
import "@/styles/transactional.css";

type Order = { currency?: string | null; email?: string | null };

function ThankYou({ order, tzLabel }: { order?: Order | null; tzLabel?: string | null }) {
  const currency = order?.currency;
  const email = order?.email;
  const { price, anchor } = displayForCurrency(currency);
  const nineLabel = tzLabel ? `9 PM ${tzLabel}` : "9 PM";

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

          {/* Delivery-email confirmation, surfaced high so it's seen without
              scrolling — the buyer's typo safety net. */}
          {email && (
            <p className="tx-confirm">
              Your stories are headed to{" "}
              <b>{email}</b>. Not you? Write to us at{" "}
              <a href="mailto:hello@stillatnine.com">hello@stillatnine.com</a>.
            </p>
          )}

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
                <span className="tx-step-txt">Your first story lands <b>tonight at {nineLabel}</b>, then three nights a week.</span>
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
function useCaptureTimezone(onOrder: (order: Order) => void, enabled: boolean) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!enabled) return; // payment didn't succeed — don't touch any record
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
            if (body && !cancelled) {
              onOrder({ currency: body.currency, email: body.email });
            }
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
  }, [searchParams, onOrder, enabled]);
}

/** The buyer's resolved timezone abbreviation (e.g. "IST", "GMT+5:30"). */
function useTimezoneLabel(): string | null {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    // Client-only (avoids SSR/hydration mismatch — the server is UTC).
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      const part = new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        hour: "numeric",
        timeZoneName: "short",
      })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName");
      if (part?.value) setLabel(part.value);
    } catch {
      /* Intl unavailable — fall back to a plain "9 PM" */
    }
  }, []);
  return label;
}

function WelcomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Dodo sends the outcome in `status`. Anything other than success means the
  // payment didn't go through — send them to the error page instead of
  // showing a false "You're in".
  const status = searchParams.get("status");
  const failed = status !== null && status !== "succeeded";

  useEffect(() => {
    if (failed) router.replace("/error");
  }, [failed, router]);

  const [order, setOrder] = useState<Order | null>(null);
  const tzLabel = useTimezoneLabel();
  useCaptureTimezone(setOrder, !failed);

  if (failed) return null; // don't flash the success UI while redirecting
  return <ThankYou order={order} tzLabel={tzLabel} />;
}

export default function WelcomePage() {
  // useSearchParams must sit inside a Suspense boundary.
  return (
    <Suspense fallback={<ThankYou />}>
      <WelcomeClient />
    </Suspense>
  );
}
