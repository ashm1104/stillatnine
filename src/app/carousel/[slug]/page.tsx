// Carousel gallery (Section E — usable without code). Shows the generated
// 1080x1080 slides for a story so the owner can right-click → save each for
// IG/Pinterest. Change the slug to make a new set. Internal tool — noindexed.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoryBySlug } from "@/lib/stories-db";

export const metadata: Metadata = {
  title: "Carousel — Still at Nine",
  robots: { index: false, follow: false },
};

const SLIDES = [1, 2, 3];

export default async function CarouselGallery({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) notFound();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#130F0A",
        color: "#F0E9DC",
        fontFamily: "'Spectral', Georgia, serif",
        padding: "56px 28px 80px",
      }}
    >
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <p style={{ color: "#D8A24C", letterSpacing: "0.24em", textTransform: "uppercase", fontSize: 12, margin: "0 0 10px" }}>
          Carousel · IG / Pinterest · 1080×1080
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, fontSize: 30, margin: "0 0 8px" }}>
          {story.title}
        </h1>
        <p style={{ color: "#9C8E78", fontSize: 15, margin: "0 0 36px" }}>
          Right-click any slide → <em>Save image as…</em> Then post them in order. To make a new
          set, open <code>/carousel/&lt;another-slug&gt;</code>.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {SLIDES.map((n) => (
            <figure key={n} style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/carousel/${slug}/img?n=${n}`}
                alt={`Slide ${n}`}
                width={1080}
                height={1080}
                style={{ width: "100%", height: "auto", borderRadius: 12, border: "1px solid #2C231A", display: "block" }}
              />
              <figcaption style={{ color: "#9C8E78", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 10 }}>
                Slide {n}
                {" · "}
                <a href={`/carousel/${slug}/img?n=${n}`} target="_blank" rel="noreferrer" style={{ color: "#D8A24C" }}>
                  open full size
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </main>
  );
}
