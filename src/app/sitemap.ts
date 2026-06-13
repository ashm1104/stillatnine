import type { MetadataRoute } from "next";
import { getPublishedSlugs } from "@/lib/stories-db";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://stillatnine.com"
).replace(/\/$/, "");

export const revalidate = 3600;

// Public, indexable pages only. Transactional + token pages stay out (see
// robots.ts). Story pages come from Supabase so the sitemap grows with content.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const slugs = await getPublishedSlugs();

  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/stories`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    ...slugs.map((slug) => ({
      url: `${SITE_URL}/stories/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
