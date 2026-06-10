import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://stillatnine.com"
).replace(/\/$/, "");

// Only the marketing landing page is meant for crawlers. Everything else is
// either an API route, a token-bound link, or a post-payment page that should
// never be indexed (and would be useless without a real token / purchase).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/welcome", "/unsubscribed", "/error"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
