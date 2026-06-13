// Dynamic OG image for a story page (also satisfies Section E's "dynamic OG-image
// route"). On-brand card built from the story title: dark lamplight background,
// amber lamp + eyebrow, title in Playfair (fetched at build/revalidate; falls
// back to the default serif if the font fetch fails).

import { ImageResponse } from "next/og";
import { getStoryBySlug } from "@/lib/stories-db";

export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "Still at Nine";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand tokens (from tokens.css; OG images can't read CSS vars).
const DK_BG = "#130F0A";
const ACCENT = "#D8A24C";
const DK_TEXT = "#F0E9DC";
const DK_MUTED = "#9C8E78";

/** Fetch a Playfair Display TTF from Google Fonts (TTF, not woff2, for satori). */
async function playfair(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600",
      // An old UA makes Google serve a TTF (satori can't parse woff2).
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1)" } },
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\((https:\/\/[^)]+\.ttf)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  const title = story?.title ?? "Still at Nine";
  const eyebrow = (story?.category ?? "Still at Nine").toUpperCase();

  const font = await playfair();
  const fonts = font
    ? [{ name: "Playfair Display", data: font, weight: 600 as const, style: "normal" as const }]
    : undefined;
  const titleFamily = font ? "Playfair Display, serif" : "serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `radial-gradient(120% 90% at 50% 115%, rgba(216,162,76,0.22) 0%, rgba(216,162,76,0.04) 38%, ${DK_BG} 68%)`,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 20,
              background: ACCENT,
              boxShadow: `0 0 40px 8px rgba(216,162,76,0.6)`,
            }}
          />
          <div
            style={{
              marginLeft: 18,
              color: DK_TEXT,
              fontSize: 30,
              fontFamily: titleFamily,
              letterSpacing: "-0.01em",
            }}
          >
            Still at Nine
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: ACCENT,
              fontSize: 24,
              letterSpacing: "0.28em",
              marginBottom: 24,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              color: DK_TEXT,
              fontSize: title.length > 48 ? 64 : 80,
              lineHeight: 1.08,
              fontFamily: titleFamily,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ color: DK_MUTED, fontSize: 26, letterSpacing: "0.06em" }}>
          Strange, true stories. Delivered after dark.
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
