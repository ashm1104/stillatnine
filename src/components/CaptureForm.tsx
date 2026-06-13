"use client";

// Funnel email capture — the PRIMARY CTA on the preview modals (buy is the
// secondary). Captures email + browser timezone, POSTs /api/subscribe, then
// swaps to an on-brand confirmation. The 9 PM story IS the confirmation, so the
// copy promises exactly that ("It's coming tonight at nine." / "You're just in
// time."). See launch-reference.md Part 1 + Part 3 Section A.

import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type State =
  | "just_in_time"
  | "queued"
  | "resubscribed"
  | "already_pending"
  | "already_customer";

// Confirmation copy per server-returned state.
const CONFIRM: Record<State, { title: string; body: string }> = {
  just_in_time: {
    title: "You're just in time.",
    body: "Tonight's story is already on its way — it should land in a few minutes. Check your inbox.",
  },
  queued: {
    title: "It's coming tonight at nine.",
    body: "Your first story arrives at 9 PM, your time. Keep an eye on your inbox after dark.",
  },
  resubscribed: {
    title: "The lamp's back on.",
    body: "Your first story arrives tonight at 9 PM, your time.",
  },
  already_pending: {
    title: "You're already on the list.",
    body: "A story is already on its way to you. Nothing more to do — watch your inbox at nine.",
  },
  already_customer: {
    title: "You already have the collection.",
    body: "This inbox is set up for all 24. If something's missing, just reply to any email — it reaches a person.",
  },
};

export function CaptureForm({
  source,
  ctaLabel = "Read it in full tonight — free",
}: {
  source: string;
  ctaLabel?: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<State | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const clean = email.trim();
    if (!EMAIL_RE.test(clean)) {
      setError("That doesn't look like an email.");
      return;
    }
    setError(null);
    setBusy(true);

    let timezone = "";
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      // Intl unavailable — the server defaults to UTC.
    }

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, timezone, source }),
      });
      const data = (await res.json().catch(() => ({}))) as { state?: State; error?: string };
      if (!res.ok || !data.state) {
        setError("Something went wrong. Try again in a moment.");
        setBusy(false);
        return;
      }
      setDone(data.state);
    } catch {
      setError("Couldn't reach us just now. Try again in a moment.");
      setBusy(false);
    }
  }

  if (done) {
    const c = CONFIRM[done];
    return (
      <div className="capture capture--done" role="status">
        <span className="capture-lamp" aria-hidden="true" />
        <p className="capture-done-title">{c.title}</p>
        <p className="capture-done-body">{c.body}</p>
      </div>
    );
  }

  return (
    <form className="capture" onSubmit={submit} noValidate>
      <div className="capture-row">
        <input
          type="email"
          className="capture-input"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          aria-label="Email address"
          autoComplete="email"
          disabled={busy}
          required
        />
        <button type="submit" className="cta-btn cta-btn--sm capture-btn" disabled={busy} aria-busy={busy}>
          {busy ? (
            <>
              <span className="tx-spin" aria-hidden="true" />
              Sending…
            </>
          ) : (
            ctaLabel
          )}
        </button>
      </div>
      {error ? (
        <p className="capture-error" role="alert">{error}</p>
      ) : (
        <p className="capture-note">One story tonight at nine. No account, unsubscribe anytime.</p>
      )}
    </form>
  );
}
