// Section 1 — Hero. Locked layout: cinematic, atmosphere: rich (HANDOFF §6).
// Ported from lp-app.jsx (cinematic branch).

import { Eyebrow } from "./Shared";
import { HeroAtmosphere } from "./HeroAtmosphere";
import { CtaButton } from "./CtaButton";
import { AC } from "@/lib/theme";
import type { Pricing } from "@/lib/pricing";

export function HeroSection({ pricing }: { pricing: Pricing }) {
  return (
    <section className="hero hero--cinematic" id="hero">
      <HeroAtmosphere level="rich" />
      <div className="hero-inner">
        <div>
          <div className="hero-content">
            <Eyebrow dark>Three nights a week · 9 PM</Eyebrow>
            <h1 className="hero-title hero-title--cine">Still at Nine</h1>
            <div
              className="hero-underscore"
              style={{ width: 200, height: 2, background: AC, opacity: 0.55, borderRadius: 1, margin: "16px auto 0" }}
            />
            <p className="hero-tagline">Strange, true stories. Delivered after dark.</p>
            <p className="hero-lead">
              A series of real-world mysteries, strange histories, and unexplained events. 24 stories over 8 weeks —
              delivered to your inbox at 9 PM.
            </p>
            <CtaButton checkoutUrl={pricing.checkoutUrl} style={{ width: "100%", maxWidth: 420 }}>
              Get Still at Nine — <span className="strike">{pricing.anchor}</span> {pricing.price} one time
            </CtaButton>
            <p className="hero-sub">One payment. No subscription. Yours to keep.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
