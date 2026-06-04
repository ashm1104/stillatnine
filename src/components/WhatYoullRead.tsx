// Section 2 — What you'll read. Locked copy. Ported from lp-app.jsx.

import { SectionWrap, Eyebrow, DiamondRule } from "./Shared";
import { AC, AC2 } from "@/lib/theme";

export function WhatYoullRead({ dark }: { dark: boolean }) {
  const acc = dark ? AC : AC2;
  return (
    <SectionWrap dark={dark} id="what">
      <Eyebrow dark={dark}>What you&apos;ll read</Eyebrow>
      <h2 className="sec-h2">Some stories were never resolved.</h2>
      <p className="sec-body sec-body--read">
        A village that vanished without evacuation. A signal that repeated for decades with no known source. A
        manuscript no one has ever been able to read. Still at Nine is a collection of 24 stories like these —
        meticulously researched, grippingly told, and delivered to your inbox three nights a week.
      </p>
      <DiamondRule color={acc} />
    </SectionWrap>
  );
}
