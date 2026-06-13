"use client";

// Section 3 — Stories like these + StoryModal. Locked card style: archive.
// Tap a story -> modal preview that cuts off mid-sentence to tease the paid
// story. Ported from lp-app.jsx (StoriesSection + StoryModal).

import { useState } from "react";
import { SectionWrap, Eyebrow } from "./Shared";
import { CaptureForm } from "./CaptureForm";
import { CtaButton } from "./CtaButton";
import { STORIES } from "@/lib/stories";
import { AC, AC2, TDK, TLT, MDK, MLT } from "@/lib/theme";
import type { Pricing } from "@/lib/pricing";

export function StoriesSection({ dark, pricing }: { dark: boolean; pricing: Pricing }) {
  const [activeStory, setActiveStory] = useState<number | null>(null);

  return (
    <SectionWrap dark={dark} id="stories" className="stories-sec">
      <Eyebrow dark={dark}>Stories like these</Eyebrow>
      <p className="sec-subtitle" style={{ color: dark ? MDK : MLT, fontStyle: "italic" }}>
        Land in your inbox at nine.
      </p>
      <div className="story-list story-list--archive">
        {STORIES.map((s, i) => (
          <button key={i} className="story-item story-item--archive" onClick={() => setActiveStory(i)}>
            <span className="story-num" style={{ color: dark ? AC : AC2 }}>
              Still at Nine #{s.num}
            </span>
            <span className="story-title" style={{ color: dark ? TDK : TLT }}>
              {s.title}
            </span>
            <span className="story-arrow" style={{ color: dark ? MDK : MLT }}>
              →
            </span>
          </button>
        ))}
      </div>
      <p className="story-hint" style={{ color: dark ? MDK : MLT }}>
        Tap a story to preview it.
      </p>

      <StoryModal
        story={activeStory}
        onClose={() => setActiveStory(null)}
        price={pricing.price}
        anchor={pricing.anchor}
        checkoutUrl={pricing.checkoutUrl}
      />
    </SectionWrap>
  );
}

function StoryModal({
  story,
  onClose,
  price,
  anchor,
  checkoutUrl,
}: {
  story: number | null;
  onClose: () => void;
  price: string;
  anchor: string;
  checkoutUrl: string;
}) {
  if (story == null) return null;
  const s = STORIES[story];
  // PRIMARY = email capture (read it free tonight); SECONDARY = buy the
  // collection. The 9 PM story demos the product; the funnel demos it rather
  // than describing it (launch-reference.md Part 1).
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <span className="modal-num">Still at Nine #{s.num}</span>
        <h3 className="modal-title">{s.title}</h3>
        <div className="modal-body">
          {s.preview.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {s.cutoff && <span className="modal-ellipsis">…</span>}
        </div>
        <div className="modal-tease">
          <p>{s.cutoff ? "This story continues in your inbox." : "This is one of 24 stories."}</p>
          <CaptureForm
            source={`modal-${s.num}`}
            ctaLabel={s.cutoff ? "Read it in full tonight — free" : "Read tonight's story — free"}
          />
          <div className="modal-or"><span>or get the whole collection</span></div>
          <CtaButton checkoutUrl={checkoutUrl} className="cta-btn--sm cta-btn--ghost">
            Get all 24 — <span className="strike">{anchor}</span> {price}
          </CtaButton>
        </div>
      </div>
    </div>
  );
}
