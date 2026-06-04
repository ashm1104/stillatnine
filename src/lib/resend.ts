// Resend client for transactional email (server-side only).
//
// Read the key lazily so importing this module never throws at build time —
// it only matters when we actually send (inside an API route / webhook).

import { Resend } from "resend";

/** From-address for outbound mail. Display name + verified sender. */
export const RESEND_FROM = `Still at Nine <${
  process.env.RESEND_FROM_EMAIL || "stories@stillatnine.com"
}>`;

/** Replies reach a human. */
export const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO || "hello@stillatnine.com";

export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("Missing env var RESEND_API_KEY");
  }
  return new Resend(key);
}
