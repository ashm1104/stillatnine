import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://stillatnine.com"
).replace(/\/$/, "");

// Public, indexable pages only. /privacy and /terms join this list once they
// ship in Phase 6 Track B; transactional + token pages stay out (see robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
