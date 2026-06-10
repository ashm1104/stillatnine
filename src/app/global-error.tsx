"use client";

// Last-resort error boundary: catches errors thrown in the ROOT layout itself,
// where app/error.tsx can't help. It replaces the whole document, so it must
// render its own <html>/<body> and can't rely on layout fonts or globals.css —
// hence the self-contained inline styles (Georgia is the brand serif fallback).

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#130F0A", color: "#F0E9DC" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#D8A24C",
              boxShadow: "0 0 16px 3px rgba(216,162,76,0.45)",
            }}
          />
          <h1 style={{ fontSize: 32, fontWeight: 600, margin: "28px 0 0", letterSpacing: "-0.01em" }}>
            The lamp went out.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "#9C8E78", margin: "16px 0 0", maxWidth: 420 }}>
            An unexpected error interrupted things on our end. It&rsquo;s not you &mdash;
            try again in a moment.
          </p>
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                appearance: "none",
                border: 0,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 17,
                color: "#130F0A",
                background: "#D8A24C",
                padding: "16px 34px",
                borderRadius: 10,
              }}
            >
              Try again
            </button>
            <a href="/" style={{ fontSize: 15, color: "#9C8E78", textDecoration: "none" }}>
              Return to Still at Nine instead &rsaquo;
            </a>
          </div>
          <p style={{ marginTop: 26, fontSize: 14, color: "#9C8E78" }}>
            Still stuck? Write to{" "}
            <a href="mailto:hello@stillatnine.com" style={{ color: "#D8A24C", textDecoration: "none" }}>
              hello@stillatnine.com
            </a>
            .
          </p>
        </main>
      </body>
    </html>
  );
}
