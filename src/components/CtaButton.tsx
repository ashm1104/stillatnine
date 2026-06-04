"use client";

// The purchase CTA. Saves the reader's timezone to localStorage (delivery is
// scheduled 9 PM reader-local), then redirects to the geo-detected Dodo
// checkout. Shows the busy/spinner state from HANDOFF §8 while redirecting.

import { useState, type ReactNode, type CSSProperties } from "react";

export function CtaButton({
  checkoutUrl,
  className,
  children,
  style,
}: {
  checkoutUrl: string;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    if (busy) return;
    setBusy(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) localStorage.setItem("san_timezone", tz);
    } catch {
      // localStorage / Intl unavailable — proceed to checkout anyway.
    }
    window.location.href = checkoutUrl;
  };

  return (
    <button
      className={`cta-btn ${className || ""} ${busy ? "tx-cta--busy" : ""}`}
      style={style}
      onClick={handleClick}
      disabled={busy}
      aria-busy={busy}
    >
      {busy ? (
        <>
          <span className="tx-spin" aria-hidden="true" />
          Processing…
        </>
      ) : (
        children
      )}
    </button>
  );
}
