// Section 7 — Final CTA. Ported from lp-app.jsx.

import { SectionWrap } from "./Shared";
import { CtaButton } from "./CtaButton";
import { MDK, MLT } from "@/lib/theme";
import type { Pricing } from "@/lib/pricing";

export function FinalCTA({ dark, pricing }: { dark: boolean; pricing: Pricing }) {
  return (
    <SectionWrap dark={dark} id="final-cta" className="sec--cta">
      <p className="cta-kicker" style={{ color: dark ? MDK : MLT, fontStyle: "italic" }}>
        One payment. No subscription. Just the stories after dark.
      </p>
      <h2 className="sec-h2 sec-h2--lg">
        24 stories. 8 weeks.
        <br />
        Delivered at nine.
      </h2>
      <CtaButton checkoutUrl={pricing.checkoutUrl} className="cta-btn--lg">
        Get Still at Nine — <span className="strike">{pricing.anchor}</span> {pricing.price} one time
      </CtaButton>
    </SectionWrap>
  );
}
