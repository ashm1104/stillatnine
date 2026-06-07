# Story content — canonical format

Each story is a JSON file in `content/stories/` (named `NN-slug.json`). The
structuring agent outputs this shape; `scripts/import-story.ts` upserts it into
the Supabase `stories` table on `story_number`. The delivery Edge Function
renders `content_blocks` into the email to match `/emails/story-template.html`.

## Import

```bash
npx tsx scripts/import-story.ts content/stories/01-the-grave.json content/stories/02-the-cias-last-code.json
```

Reads `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`.
Idempotent — re-running updates the existing row.

## Schema

```jsonc
{
  "story_number": 1,                    // 1–24, unique
  "title": "The Grave That Shouldn't Exist",   // punchy EMAIL title (≠ the working title)
  "subject_line": "...",                // inbox hook; never repeats the title
  "preheader": "...",                   // preview text; continues the hook, ends mid-thought
  "category": "Disappearances",         // short eyebrow label
  "read_minutes": 5,                    // ~word_count / 200
  "word_count": 1026,                   // optional
  "status": "ready",                    // draft | ready | live  (only ready/live are delivered)
  "disclaimer": "Every Still at Nine story is built from documented sources. …",
  "content_blocks": [ /* see below */ ],
  "sources": [ { "text": "Publisher — Headline", "url": "https://…" } ]
}
```

### `content_blocks`

Ordered array. The **first block must be `lead`** (rendered with a drop-cap).

| `kind`    | fields   | renders as |
|-----------|----------|------------|
| `lead`    | `text`   | opening paragraph, drop-cap first letter |
| `p`       | `text`   | body paragraph |
| `section` | `label`  | a diamond divider + short uppercase section label (Title Case, 2–4 words) |
| `quote`   | `text`   | centered italic pull-quote (pick ONE strong line; remove it from the surrounding paragraph so it isn't duplicated) |
| `list`    | `items[]`| bullet list |

### Authoring rules (for the structuring agent)

1. Strip all frontmatter and agent/QA notes — published prose only.
2. First paragraph → `lead`.
3. Insert a `section` label at each scene break (the `---` rules and `##`/`###`
   headers in the toned draft). Labels are short and evocative, not sentences.
4. Choose exactly **one** `quote` — the single most resonant line — and lift it
   out of its paragraph so it appears once.
5. Proper-noun italics from the draft (e.g. *Sarah Joe*) become plain text.
6. Write `subject_line` + `preheader` as a fresh inbox hook (don't reuse the
   title). `category` is a 1–2 word eyebrow.
7. `disclaimer` is the fixed brand line above unless a story needs its own.
