// Shared font loader for image-generation routes (OG images + carousel slides).
// satori (next/og) needs a TTF/OTF — not woff2 — so we ask Google Fonts with an
// old User-Agent to get a TTF, and cache the result per server instance.

import "server-only";

let cached: ArrayBuffer | null | undefined;

/**
 * Playfair Display 600 as a TTF ArrayBuffer, or null if the fetch fails (callers
 * fall back to the default serif). Memoized for the life of the server instance.
 */
export async function playfairTTF(): Promise<ArrayBuffer | null> {
  if (cached !== undefined) return cached;
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600",
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1)" } },
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\((https:\/\/[^)]+\.ttf)\)/)?.[1];
    cached = url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    cached = null;
  }
  return cached ?? null;
}
