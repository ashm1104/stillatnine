// Section 5 — What this is not. Locked copy. Ported from lp-app.jsx.

import { SectionWrap, Eyebrow } from "./Shared";

export function WhatThisIsNot({ dark }: { dark: boolean }) {
  return (
    <SectionWrap dark={dark} id="not" className="sec--narrow">
      <Eyebrow dark={dark}>What this is not</Eyebrow>
      <h2 className="sec-h2">Not horror. Not true crime. Not clickbait.</h2>
      <p className="sec-body sec-body--read">
        A quiet archive of things that happened and were never fully explained.
      </p>
    </SectionWrap>
  );
}
