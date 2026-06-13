// /stories/[slug] — a single story, rendered from Supabase (ISR).
//
// Pool B/C  -> full public page (the SEO surface): complete story + sources.
// Pool A    -> locked stub: hook + locked styling + capture (primary) / buy.
// Full HTML at request time (no client-only rendering) so Google indexes it.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import "@/styles/transactional.css";
import "@/styles/stories.css";
import { Atmosphere, Brand, Footer } from "@/components/TxChrome";
import { CaptureForm } from "@/components/CaptureForm";
import { StoryContent, StorySources } from "@/components/StoryContent";
import { getStoryBySlug, getPublishedSlugs, isFullyPublic, storyHook } from "@/lib/stories-db";

export const revalidate = 3600; // ISR

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://stillatnine.com").replace(/\/$/, "");

export async function generateStaticParams() {
  return (await getPublishedSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return { title: "Not found — Still at Nine" };

  const description = storyHook(story, 155);
  const url = `/stories/${slug}`;
  const ogImage = `${SITE_URL}/stories/${slug}/opengraph-image`;
  return {
    title: `${story.title} — Still at Nine`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: story.title,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: story.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) notFound();

  const full = isFullyPublic(story.pool);
  const num = String(story.story_number).padStart(2, "0");

  // Article structured data — only on full public pages (real content).
  const jsonLd = full
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: story.title,
        description: storyHook(story, 155),
        articleSection: story.category ?? "Mystery",
        author: { "@type": "Organization", name: "Still at Nine" },
        publisher: {
          "@type": "Organization",
          name: "Still at Nine",
          url: SITE_URL,
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/stories/${slug}` },
        isAccessibleForFree: true,
      }
    : null;

  return (
    <main className="st-page">
      <Atmosphere level="subtle" />
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      <article className="st-shell st-article">
        <header className="st-head">
          <Brand />
          <p className="st-eyebrow">{story.category ?? "Still at Nine"}</p>
          <h1 className="st-title">{story.title}</h1>
          <p className="st-meta">
            Still at Nine #{num}
            {story.read_minutes ? ` · ${story.read_minutes} min read` : ""}
          </p>
          <div className="st-rule" aria-hidden="true" />
        </header>

        {full ? (
          <>
            <div className="st-body">
              <StoryContent blocks={story.content_blocks} />
            </div>
            <StorySources sources={story.sources} disclaimer={story.disclaimer} />

            <section className="st-tail-cta">
              <p className="st-cta-lead">Stories like this land in your inbox at nine.</p>
              <CaptureForm source={`story-${slug}`} ctaLabel="Send me tonight's story — free" />
              <p className="st-cta-or">
                or <Link href="/" className="st-link">get the whole collection →</Link>
              </p>
            </section>
          </>
        ) : (
          <div className="st-locked">
            <div className="st-body st-body--teaser">
              <p className="st-lead">{storyHook(story, 320)}</p>
            </div>
            <div className="st-lock-panel">
              <span className="st-lock-mark" aria-hidden="true">✦</span>
              <p className="st-lock-title">This one stays in the collection.</p>
              <p className="st-lock-note">
                It isn&rsquo;t published in full anywhere but the inbox. Start with a free story
                tonight, or get all twenty-four.
              </p>
              <CaptureForm source={`stub-${slug}`} ctaLabel="Read a free story tonight" />
              <p className="st-cta-or">
                or <Link href="/" className="st-link">get the whole collection →</Link>
              </p>
            </div>
          </div>
        )}
      </article>
      <Footer />
    </main>
  );
}
