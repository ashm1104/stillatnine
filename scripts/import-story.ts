// Seed/update stories in Supabase from canonical story JSON files.
//
//   npx tsx scripts/import-story.ts content/stories/01-the-grave.json [more...]
//
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local
// (or the ambient env) and upserts each file on `story_number`. Idempotent.
// See content/README.md for the canonical format.

import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type Block =
  | { kind: "lead" | "p" | "quote"; text: string }
  | { kind: "section"; label: string }
  | { kind: "list"; items: string[] };

type Story = {
  story_number: number;
  title: string;
  subject_line: string;
  preheader: string;
  category: string;
  read_minutes: number;
  word_count?: number;
  status?: "draft" | "ready" | "live";
  disclaimer: string;
  content_blocks: Block[];
  sources: { text: string; url?: string }[];
};

/** Minimal .env.local loader so the script runs without extra deps. */
function loadEnvLocal() {
  try {
    const raw = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* no .env.local — rely on ambient env */
  }
}

function validate(s: Story, file: string) {
  const req = ["story_number", "title", "subject_line", "preheader", "category", "content_blocks"] as const;
  for (const k of req) {
    if (s[k] === undefined || s[k] === null || s[k] === "") throw new Error(`${file}: missing "${k}"`);
  }
  if (!Array.isArray(s.content_blocks) || s.content_blocks.length === 0) {
    throw new Error(`${file}: content_blocks must be a non-empty array`);
  }
  if (s.content_blocks[0].kind !== "lead") {
    throw new Error(`${file}: the first block must be a "lead"`);
  }
  for (const b of s.content_blocks) {
    if (b.kind === "section" && !("label" in b && b.label)) throw new Error(`${file}: a section is missing its label`);
    if ((b.kind === "lead" || b.kind === "p" || b.kind === "quote") && !("text" in b && b.text)) {
      throw new Error(`${file}: a ${b.kind} block is missing text`);
    }
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");

  const files = process.argv.slice(2);
  if (files.length === 0) throw new Error("Usage: tsx scripts/import-story.ts <file.json> [...]");

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  for (const file of files) {
    const story = JSON.parse(readFileSync(file, "utf8")) as Story;
    validate(story, file);

    const { error } = await supabase.from("stories").upsert(
      {
        story_number: story.story_number,
        title: story.title,
        subject_line: story.subject_line,
        preheader: story.preheader,
        category: story.category,
        read_minutes: story.read_minutes ?? null,
        word_count: story.word_count ?? null,
        status: story.status ?? "ready",
        disclaimer: story.disclaimer ?? null,
        content_blocks: story.content_blocks,
        sources: story.sources ?? [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "story_number" },
    );

    if (error) throw new Error(`${file}: ${error.message}`);
    console.log(`✓ story ${story.story_number} — "${story.title}" (${story.content_blocks.length} blocks)`);
  }
  console.log(`Done. Imported ${files.length} stor${files.length === 1 ? "y" : "ies"}.`);
}

main().catch((e) => {
  console.error("Import failed:", e.message);
  process.exit(1);
});
