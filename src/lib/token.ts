// Signed, no-login credential tokens for email management links.
//
// The identity model is "no accounts" (see DECISIONS.md): the token IS the
// credential. A token is `<userId>.<sig>` where sig = base64url(HMAC-SHA256(
// userId, UNSUBSCRIBE_TOKEN_SECRET)). It proves the holder was given a link we
// generated for that user — without a password and without a guessable raw id
// in the URL.
//
// The SAME scheme is implemented in the delivery Edge Function (Deno) so story
// emails carry verifiable links; keep the two in sync (base64url, no padding).
// UNSUBSCRIBE_TOKEN_SECRET must be set in BOTH Vercel and Supabase secrets.

import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const s = process.env.UNSUBSCRIBE_TOKEN_SECRET;
  if (!s) throw new Error("Missing env var UNSUBSCRIBE_TOKEN_SECRET");
  return s;
}

function sign(userId: string): string {
  return createHmac("sha256", secret()).update(userId).digest("base64url");
}

/** Build a `<userId>.<sig>` token for the user's management links. */
export function createToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

/**
 * Verify a token and return the userId it authorises, or null if the signature
 * doesn't match (tampered, truncated, or signed with a different secret).
 */
export function verifyToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const dot = token.indexOf("."); // userId (UUID) and base64url sig contain no "."
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = sign(userId);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? userId : null;
}
