import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stillatnine.com";

// Google Fonts — The Archive. Weights per HANDOFF §3.
// Playfair Display: 500/600/700 + italic 500 · Spectral: 300/400/500/600 + italic 400 · Spectral SC: 500/600
const FONTS_HREF =
  "https://fonts.googleapis.com/css2?" +
  "family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&" +
  "family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400&" +
  "family=Spectral+SC:wght@500;600&display=swap";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Still at Nine — Strange, true stories. Delivered after dark.",
  description:
    "A series of real-world mysteries, strange histories, and unexplained events. 24 stories over 8 weeks — delivered to your inbox at 9 PM.",
  applicationName: "Still at Nine",
  icons: {
    icon: "/favicon.png",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    type: "website",
    siteName: "Still at Nine",
    title: "Still at Nine — Strange, true stories. Delivered after dark.",
    description:
      "24 real-world mysteries over 8 weeks, delivered to your inbox at 9 PM. One payment. No subscription.",
    url: siteUrl,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Still at Nine" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Still at Nine — Strange, true stories. Delivered after dark.",
    description:
      "24 real-world mysteries over 8 weeks, delivered to your inbox at 9 PM. One payment. No subscription.",
    images: ["/twitter-card.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#130F0A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_HREF} />
      </head>
      <body>{children}</body>
    </html>
  );
}
