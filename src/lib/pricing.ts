// Geo-aware pricing for Still at Nine.
// India -> ₹499 (anchor ₹799). Everywhere else -> $19 (anchor $24).
// Checkout redirects to a geo-detected Dodo Payments product (see ./dodo).

import { dodoCheckoutUrl, type Currency } from "@/lib/dodo";

export type { Currency };

export interface Pricing {
  currency: Currency;
  /** Display price, e.g. "$19" / "₹499". */
  price: string;
  /** Anchor (struck-through) price, e.g. "$24" / "₹799". */
  anchor: string;
  /** Fully-built Dodo checkout URL for this currency. */
  checkoutUrl: string;
}

/**
 * Marketing price + anchor for a currency. The single source of truth for the
 * displayed price strings — used both for geo-pricing on the landing page and
 * for the post-purchase receipt on /welcome (where we only know the currency).
 */
export function displayForCurrency(currency: string | null | undefined): {
  price: string;
  anchor: string;
} {
  return (currency || "").toUpperCase() === "INR"
    ? { price: "₹499", anchor: "₹799" }
    : { price: "$19", anchor: "$24" };
}

/**
 * Resolve pricing from a country code (Vercel `x-vercel-ip-country`).
 * Pass the raw header value; anything other than "IN" gets USD pricing.
 */
export function getPricing(country: string | null | undefined): Pricing {
  const isIndia = (country || "").toUpperCase() === "IN";
  const currency: Currency = isIndia ? "INR" : "USD";
  return {
    currency,
    ...displayForCurrency(currency),
    checkoutUrl: dodoCheckoutUrl(country),
  };
}
