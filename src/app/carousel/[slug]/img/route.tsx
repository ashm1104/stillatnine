// Carousel slide generator (Section E — "design as dev"). Returns one on-brand
// 1080x1080 PNG slide for IG/Pinterest, built from a story in Supabase.
//   GET /carousel/<slug>/img?n=1   (n = 1..3)
// "New story = text swap" — change the slug; the slides regenerate. The gallery
// at /carousel/<slug> shows all three to save. Internal tool, noindexed.

import { ImageResponse } from "next/og";
import { getStoryBySlug, storyHook } from "@/lib/stories-db";
import { playfairTTF } from "@/lib/brand-font";

export const runtime = "nodejs";

const SIZE = 1080;
const DK_BG = "#130F0A";
const ACCENT = "#D8A24C";
const DK_TEXT = "#F0E9DC";
const DK_MUTED = "#9C8E78";

const bg = `radial-gradient(120% 90% at 50% 116%, rgba(216,162,76,0.20) 0%, rgba(216,162,76,0.04) 40%, ${DK_BG} 70%)`;

function lamp(size = 22) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: ACCENT,
        boxShadow: `0 0 44px 9px rgba(216,162,76,0.6)`,
      }}
    />
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  const n = Number(new URL(req.url).searchParams.get("n") ?? "1");

  const title = story?.title ?? "Still at Nine";
  const eyebrow = (story?.category ?? "Still at Nine").toUpperCase();
  const hook = story ? storyHook(story, 240) : "Strange, true stories. Delivered after dark.";

  const font = await playfairTTF();
  const serif = font ? "Playfair Display, serif" : "serif";

  let slide: React.ReactElement;
  if (n <= 1) {
    // Cover
    slide = (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", width: "100%", padding: 88 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {lamp(20)}
          <div style={{ marginLeft: 16, color: DK_TEXT, fontSize: 30, fontFamily: serif }}>Still at Nine</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: ACCENT, fontSize: 26, letterSpacing: "0.28em", marginBottom: 28 }}>{eyebrow}</div>
          <div style={{ color: DK_TEXT, fontSize: title.length > 42 ? 78 : 92, lineHeight: 1.06, fontFamily: serif, letterSpacing: "-0.02em" }}>
            {title}
          </div>
        </div>
        <div style={{ color: DK_MUTED, fontSize: 28, letterSpacing: "0.06em", fontStyle: "italic" }}>A true story.</div>
      </div>
    );
  } else if (n === 2) {
    // Hook — a drawn amber rule (not a glyph; satori's font lacks ✦).
    slide = (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", width: "100%", padding: 96 }}>
        <div style={{ width: 72, height: 3, background: ACCENT, marginBottom: 40 }} />
        <div style={{ color: DK_TEXT, fontSize: 46, lineHeight: 1.42, fontFamily: serif }}>{hook}</div>
      </div>
    );
  } else {
    // CTA
    slide = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", padding: 96, textAlign: "center" }}>
        {lamp(28)}
        <div style={{ color: DK_TEXT, fontSize: 64, lineHeight: 1.15, fontFamily: serif, margin: "40px 0 24px", letterSpacing: "-0.015em" }}>
          Read the full story — free.
        </div>
        <div style={{ color: DK_MUTED, fontSize: 30, letterSpacing: "0.04em" }}>Tonight at nine.</div>
        <div style={{ color: ACCENT, fontSize: 30, letterSpacing: "0.1em", marginTop: 48 }}>stillatnine.com</div>
      </div>
    );
  }

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: bg }}>{slide}</div>,
    {
      width: SIZE,
      height: SIZE,
      fonts: font ? [{ name: "Playfair Display", data: font, weight: 600, style: "normal" }] : undefined,
    },
  );
}
