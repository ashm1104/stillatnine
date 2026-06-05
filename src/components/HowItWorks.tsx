// Section 4 — How it works (4-tile stepped layout). Ported from lp-app.jsx.

import { SectionWrap, Eyebrow } from "./Shared";
import { AC, AC2, TDK, TLT, MDK, MLT, BDK, BLT, DK, LT } from "@/lib/theme";
import type { Pricing } from "@/lib/pricing";

const STEPS = [
  {
    num: "01",
    label: "Pay once, keep forever",
    // {price} is replaced with the geo-aware price at render time.
    desc: "{price}. No subscription, no renewal. The full collection is yours.",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  },
  {
    num: "02",
    label: "9 PM, three nights a week",
    desc: "Your phone lights up. A new story lands. The night begins.",
    icon: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  },
  {
    num: "03",
    label: "Read at your pace",
    desc: "Each story is 5–8 minutes. Open it tonight, or save it for later.",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z",
  },
  {
    num: "04",
    label: "Just email, nothing else",
    desc: "No app. No algorithm. No feed. Just you and the story.",
    icon: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  },
];

export function HowItWorks({ dark, pricing }: { dark: boolean; pricing: Pricing }) {
  const acc = dark ? AC : AC2;
  const txt = dark ? TDK : TLT;
  const mut = dark ? MDK : MLT;
  const bdr = dark ? BDK : BLT;

  return (
    <SectionWrap dark={dark} id="how" className="how-sec">
      <Eyebrow dark={dark}>How it works</Eyebrow>
      <h2 className="sec-h2">Simple. On purpose.</h2>
      <div className="how-grid">
        {STEPS.map((step, i) => (
          <div key={i} className="how-step" style={{ borderColor: bdr }}>
            <div className="how-step-head">
              <span className="how-step-num" style={{ color: acc }}>
                {step.num}
              </span>
              <div className="how-step-dot" style={{ background: acc }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill={dark ? DK : LT}>
                  <path d={step.icon} />
                </svg>
              </div>
            </div>
            <h3 className="how-step-label" style={{ color: txt }}>
              {step.label}
            </h3>
            <p className="how-step-desc" style={{ color: mut }}>
              {step.desc.replace("{price}", pricing.price)}
            </p>
            {i < STEPS.length - 1 && <div className="how-step-thread" style={{ background: acc }} />}
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}
