// Render a story JSON to a standalone HTML file using the SAME renderer the
// delivery Edge Function uses, so you can eyeball the email locally.
//
//   npx tsx scripts/preview-story.ts content/stories/01-the-grave.json
//
// Writes public/_story-preview.html → open http://localhost:3000/_story-preview.html

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildEmail, type Story } from "../supabase/functions/deliver-stories/render.ts";

const file = process.argv[2] ?? "content/stories/01-the-grave.json";
const story = JSON.parse(readFileSync(file, "utf8")) as Story;

const html = buildEmail(
  story,
  "Wednesday, 9:00 PM",
  "https://stillatnine.com/api/unsubscribe?token=preview",
);

const out = path.join(process.cwd(), "public", "_story-preview.html");
writeFileSync(out, html, "utf8");
console.log(`Wrote ${out} — open http://localhost:3000/_story-preview.html`);
