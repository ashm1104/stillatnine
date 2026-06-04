// Dodo Payments — checkout-link builder.
//
// Static payment links: https://checkout.dodopayments.com/buy/{product_id}
// India -> INR product, everyone else -> USD product (mirrors geo-pricing).
//
// We append `redirect_url` so Dodo returns the buyer to /welcome. Dodo adds
// its own params to that URL on success (e.g. ?status=succeeded&payment_id=...),
// which the thank-you page reads to save the reader's timezone.
//
// Webhook signature verification lives in the webhook route, not here — this
// module is pure/client-safe (only NEXT_PUBLIC_* env vars, no secrets, no SDK).

export type Currency = "USD" | "INR";

const CHECKOUT_BASE =
  process.env.NEXT_PUBLIC_DODO_CHECKOUT_BASE_URL ||
  "https://checkout.dodopayments.com/buy";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://stillatnine.com"
).replace(/\/$/, "");

/** Resolve the Dodo product id + currency for a country code (`IN` -> INR). */
export function productForCountry(country: string | null | undefined): {
  productId: string | undefined;
  currency: Currency;
} {
  const isIndia = (country || "").toUpperCase() === "IN";
  return isIndia
    ? { productId: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_INR, currency: "INR" }
    : { productId: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_USD, currency: "USD" };
}

/**
 * Build the hosted-checkout URL for a country code. Falls back to the bare
 * base if the product id isn't configured yet, so dev renders don't crash —
 * the link just won't resolve to a product.
 */
export function dodoCheckoutUrl(country: string | null | undefined): string {
  const { productId } = productForCountry(country);
  if (!productId) return CHECKOUT_BASE;

  const params = new URLSearchParams({ redirect_url: `${SITE_URL}/welcome` });
  return `${CHECKOUT_BASE}/${productId}?${params.toString()}`;
}
