// Section 8 — Who's behind this. Locked copy. Ported from lp-app.jsx.

import { SectionWrap, Eyebrow } from "./Shared";
import { LogoMark } from "./Logo";
import { DK2, BLT, TDK, TLT, MDK, MLT, BDK } from "@/lib/theme";

export function WhosBehind({ dark }: { dark: boolean }) {
  return (
    <SectionWrap dark={dark} id="who" className="sec--narrow sec--who">
      <Eyebrow dark={dark}>Who&apos;s behind this</Eyebrow>
      <div className="who-card" style={{ borderColor: dark ? BDK : BLT }}>
        <div className="who-avatar" style={{ background: dark ? DK2 : BLT }}>
          <LogoMark size={14} dark={dark} />
        </div>
        <div>
          <p className="who-name" style={{ color: dark ? TDK : TLT }}>
            The Archivist
          </p>
          <p className="who-bio" style={{ color: dark ? MDK : MLT }}>
            I&apos;ve spent too many nights reading about things that never got explained. Still at Nine is the
            newsletter I wanted in my own inbox.
          </p>
        </div>
      </div>
    </SectionWrap>
  );
}
