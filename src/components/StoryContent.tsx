// Renders a story's content_blocks as semantic HTML for the public reading page
// (/stories/[slug]). Server component — no client JS. Mirrors the block kinds in
// the email renderer (lead/p/section/quote/list) but emits clean semantic markup
// styled by stories.css, not inline email styles.

import type { Block, Source } from "@/lib/stories-db";

export function StoryContent({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "lead":
            return (
              <p key={i} className="st-lead">
                {b.text}
              </p>
            );
          case "p":
            return <p key={i}>{b.text}</p>;
          case "section":
            return (
              <h2 key={i} className="st-section">
                <span className="st-section-rule" aria-hidden="true">✦</span>
                <span className="st-section-label">{b.label}</span>
              </h2>
            );
          case "quote":
            return (
              <blockquote key={i} className="st-quote">
                {b.text}
              </blockquote>
            );
          case "list":
            return (
              <ul key={i} className="st-list">
                {b.items.map((it, j) => (
                  <li key={j}>{it}</li>
                ))}
              </ul>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

export function StorySources({ sources, disclaimer }: { sources: Source[] | null; disclaimer: string | null }) {
  if (!sources?.length && !disclaimer) return null;
  return (
    <aside className="st-sources">
      <p className="st-sources-label">Sources &amp; record</p>
      {(sources ?? []).map((s, i) => {
        const text = typeof s === "string" ? s : s.text;
        const url = typeof s === "object" ? s.url : undefined;
        return (
          <p key={i} className="st-source">
            <span className="st-source-dot" aria-hidden="true">·</span>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer nofollow">
                {text}
              </a>
            ) : (
              text
            )}
          </p>
        );
      })}
      {disclaimer && <p className="st-disclaimer">{disclaimer}</p>}
    </aside>
  );
}
