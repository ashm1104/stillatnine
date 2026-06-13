// Render a story JSON to a standalone HTML file using the SAME renderer the
// delivery Edge Function uses, so you can eyeball the email locally.
//
//   npx tsx scripts/preview-story.ts content/stories/01-the-grave.json
//   npx tsx scripts/preview-story.ts content/stories/01-the-grave.json free_soft
//   npx tsx scripts/preview-story.ts pitch
//
// Variants: paid (default) | free_soft | free_firm | occasional | pitch
// Writes public/_story-preview.html → open http://localhost:3000/_story-preview.html

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  buildEmail,
  buildPitchEmail,
  type Footer,
  priceFor,
  type Story,
} from "../supabase/functions/deliver-stories/render.ts";

const UNSUB = "https://stillatnine.com/api/unsubscribe?token=preview";
const BUY = "https://stillatnine.com/?src=preview";
const { price, anchor } = priceFor("USD");

const arg1 = process.argv[2] ?? "content/stories/01-the-grave.json";
const variant = (process.argv[3] ?? (arg1 === "pitch" ? "pitch" : "paid")) as
  | "paid" | "free_soft" | "free_firm" | "occasional" | "pitch";

let html: string;
if (variant === "pitch") {
  html = buildPitchEmail({
    price, anchor, buyUrl: BUY, unsubUrl: UNSUB,
    hooks: [
      "The village that appeared on no map",
      "A signal with no source. Forty years.",
      "The manuscript no one could read",
    ],
  });
} else {
  const story = JSON.parse(readFileSync(arg1, "utf8")) as Story;
  const footer: Footer =
    variant === "free_soft" ? { kind: "free_soft", price, buyUrl: BUY }
    : variant === "free_firm" ? { kind: "free_firm", remaining: 22, buyUrl: BUY, hooks: ["The Wow! signal", "The Voynich manuscript"] }
    : variant === "occasional" ? { kind: "occasional", price, buyUrl: BUY }
    : { kind: "paid", nextWeekday: "Friday", isLast: false };
  html = buildEmail(story, "Wednesday, 9:00 PM", UNSUB, footer);
}

const out = path.join(process.cwd(), "public", "_story-preview.html");
writeFileSync(out, html, "utf8");
console.log(`Wrote ${out} (${variant}) — open http://localhost:3000/_story-preview.html`);
