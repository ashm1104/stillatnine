// Section 6 — Every story is real (trust). Locked copy. Ported from lp-app.jsx.

import { SectionWrap, Eyebrow, DiamondRule } from "./Shared";
import { AC, AC2 } from "@/lib/theme";

export function EveryStoryIsReal({ dark }: { dark: boolean }) {
  return (
    <SectionWrap dark={dark} id="real" className="sec--narrow">
      <Eyebrow dark={dark}>Every story is real</Eyebrow>
      <h2 className="sec-h2">Based on documented sources.</h2>
      <p className="sec-body sec-body--read">
        Reports, public records, archives, first-hand accounts. No fiction. No invented explanations. When the truth
        ends in uncertainty, the story ends there too.
      </p>
      <DiamondRule color={dark ? AC : AC2} />
    </SectionWrap>
  );
}
