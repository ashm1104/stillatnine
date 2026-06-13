// Server-only data access for the public story pages (/stories + /stories/[slug]).
//
// Pages render from Supabase (single source of truth, no hardcoded content).
// We use the SERVICE-ROLE client because `stories` has RLS with no anon policy
// — this code only ever runs server-side (Server Components), never shipped to
// the browser, so the key is never exposed. Pages are statically generated with
// ISR (see each route's `revalidate`), so this runs at build/revalidate time,
// not on every request.

import "server-only";
import { createAdminClient } from "@/lib/supabase";

// content_blocks JSON shape (matches the email renderer + content/README.md).
export type Block =
  | { kind: "lead" | "p" | "quote"; text: string }
  | { kind: "section"; label: string }
  | { kind: "list"; items: string[] };

export type Source = string | { text: string; url?: string };

export type StoryRow = {
  story_number: number;
  title: string;
  slug: string;
  pool: string | null;
  category: string | null;
  read_minutes: number | null;
  word_count: number | null;
  status: string | null;
  content_blocks: Block[];
  sources: Source[] | null;
  disclaimer: string | null;
  preheader: string | null;
  subject_line: string | null;
  sequence_position: number | null;
};

export type StorySummary = Pick<
  StoryRow,
  "story_number" | "title" | "slug" | "pool" | "category" | "read_minutes" | "sequence_position"
>;

const PUBLISHED = ["ready", "live"] as const;

/** Pool B + C render in full publicly; Pool A (and untagged) are locked stubs. */
export function isFullyPublic(pool: string | null): boolean {
  return pool === "B" || pool === "C";
}

/** All published stories for the archive, in sequence then number order. */
export async function getPublishedStories(): Promise<StorySummary[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stories")
    .select("story_number, title, slug, pool, category, read_minutes, sequence_position")
    .in("status", PUBLISHED)
    .not("slug", "is", null)
    .order("sequence_position", { ascending: true, nullsFirst: false })
    .order("story_number", { ascending: true });
  if (error) {
    console.error("[stories-db] archive query failed:", error);
    return [];
  }
  return (data ?? []) as StorySummary[];
}

/** One published story by slug, or null. */
export async function getStoryBySlug(slug: string): Promise<StoryRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stories")
    .select(
      "story_number, title, slug, pool, category, read_minutes, word_count, status, content_blocks, sources, disclaimer, preheader, subject_line, sequence_position",
    )
    .eq("slug", slug)
    .in("status", PUBLISHED)
    .maybeSingle();
  if (error) {
    console.error("[stories-db] slug query failed:", error);
    return null;
  }
  return (data as StoryRow | null) ?? null;
}

/** Slugs of all published stories (for generateStaticParams + sitemap). */
export async function getPublishedSlugs(): Promise<string[]> {
  return (await getPublishedStories()).map((s) => s.slug).filter(Boolean);
}

/**
 * A short plain-text teaser from the story body — the first lead/paragraph,
 * trimmed. Used as the locked-stub hook and the meta description fallback.
 */
export function storyHook(story: StoryRow, max = 200): string {
  if (story.preheader) return story.preheader;
  const first = story.content_blocks.find((b) => b.kind === "lead" || b.kind === "p");
  const text = first && "text" in first ? first.text : "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
