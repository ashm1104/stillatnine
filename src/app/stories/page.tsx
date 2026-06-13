// /stories — the public archive index. Server-rendered from Supabase with ISR
// (single source of truth; full HTML for crawlers, no client-only rendering).
// Pool B/C stories link to their full public page; the rest are locked stubs.

import type { Metadata } from "next";
import Link from "next/link";

import "@/styles/transactional.css";
import "@/styles/stories.css";
import { Atmosphere, Brand, Footer } from "@/components/TxChrome";
import { CaptureForm } from "@/components/CaptureForm";
import { getPublishedStories, isFullyPublic } from "@/lib/stories-db";

// ISR: rebuild at most hourly; new/edited stories appear without a redeploy.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The Archive — Still at Nine",
  description:
    "Twenty-four strange, true stories — real-world mysteries, strange histories, and unexplained events. Read free at 9 PM, or get the whole collection.",
  alternates: { canonical: "/stories" },
  openGraph: {
    type: "website",
    title: "The Archive — Still at Nine",
    description:
      "Twenty-four strange, true stories — real-world mysteries and unexplained events, delivered after dark.",
    url: "/stories",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Archive — Still at Nine",
    description: "Twenty-four strange, true stories — real-world mysteries and unexplained events.",
  },
};

export default async function StoriesArchive() {
  const stories = await getPublishedStories();

  return (
    <main className="st-page">
      <Atmosphere level="subtle" />
      <div className="st-shell">
        <header className="st-archive-head">
          <Brand />
          <p className="st-eyebrow">The Archive</p>
          <h1 className="st-archive-title">Stories that were never fully explained.</h1>
          <p className="st-archive-sub">
            Real-world mysteries, strange histories, and unexplained events — each one documented,
            each one delivered at nine.
          </p>
        </header>

        {stories.length === 0 ? (
          <p className="st-empty">The archive opens soon.</p>
        ) : (
          <ul className="st-archive-list">
            {stories.map((s) => {
              const open = isFullyPublic(s.pool);
              return (
                <li key={s.slug} className="st-archive-item">
                  <Link href={`/stories/${s.slug}`} className="st-archive-link">
                    <span className="st-archive-num">Still at Nine #{String(s.story_number).padStart(2, "0")}</span>
                    <span className="st-archive-name">{s.title}</span>
                    <span className={`st-archive-tag ${open ? "is-open" : "is-locked"}`}>
                      {open ? "Read free →" : "Locked"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <section className="st-archive-cta">
          <p className="st-cta-lead">Get the next one free, tonight at nine.</p>
          <CaptureForm source="page-stories" ctaLabel="Send me tonight's story — free" />
        </section>
      </div>
      <Footer />
    </main>
  );
}
