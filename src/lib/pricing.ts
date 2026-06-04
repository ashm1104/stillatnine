// Geo-aware pricing for Still at Nine.
// India -> ₹499 (anchor ₹799). Everywhere else -> $19 (anchor $24).
// Checkout redirects to a geo-detected Dodo Payments product.

export type Currency = "USD" | "INR";

export interface Pricing {
  currency: Currency;
  /** Display price, e.g. "$19" / "₹499". */
  price: string;
  /** Anchor (struck-through) price, e.g. "$24" / "₹799". */
  anchor: string;
  /** Fully-built Dodo checkout URL for this currency. */
  checkoutUrl: string;
}

const CHECKOUT_BASE =
  process.env.NEXT_PUBLIC_DODO_CHECKOUT_BASE_URL ||
  "https://checkout.dodopayments.com/buy";

function checkoutUrl(productId: string | undefined): string {
  // Fall back to the bare base if the product id isn't configured yet,
  // so local/dev renders don't crash — the link just won't resolve.
  return productId ? `${CHECKOUT_BASE}/${productId}` : CHECKOUT_BASE;
}

/**
 * Resolve pricing from a country code (Vercel `x-vercel-ip-country`).
 * Pass the raw header value; anything other than "IN" gets USD pricing.
 */
export function getPricing(country: string | null | undefined): Pricing {
  const isIndia = (country || "").toUpperCase() === "IN";

  if (isIndia) {
    return {
      currency: "INR",
      price: "₹499",
      anchor: "₹799",
      checkoutUrl: checkoutUrl(process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_INR),
    };
  }

  return {
    currency: "USD",
    price: "$19",
    anchor: "$24",
    checkoutUrl: checkoutUrl(process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_USD),
  };
}
