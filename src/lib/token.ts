// Signed, no-login credential tokens for email management links.
//
// The identity model is "no accounts" (see DECISIONS.md): the token IS the
// credential. It proves the holder was given a link we generated — without a
// password and without a guessable raw id in the URL.
//
// Two audiences, two token shapes (both base64url HMAC-SHA256, no padding):
//   - BUYER  (users table):       `<userId>.<sig>`        sig = HMAC(userId)
//   - SUBSCRIBER (subscribers):   `sub.<subId>.<sig>`     sig = HMAC("sub.<subId>")
// The `sub.` prefix self-identifies the audience so /api/unsubscribe can route
// to the right table. Buyer tokens predate the funnel and are already live in
// sent emails, so their shape is frozen for backward compatibility.
//
// The SAME scheme is implemented in the delivery Edge Function (Deno) so story
// emails carry verifiable links; keep the two in sync (base64url, no padding).
// UNSUBSCRIBE_TOKEN_SECRET must be set in BOTH Vercel and Supabase secrets.

import { createHmac, timingSafeEqual } from "node:crypto";

const SUB_PREFIX = "sub.";

function secret(): string {
  const s = process.env.UNSUBSCRIBE_TOKEN_SECRET;
  if (!s) throw new Error("Missing env var UNSUBSCRIBE_TOKEN_SECRET");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Build a `<userId>.<sig>` token for a BUYER's management links. */
export function createToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

/** Build a `sub.<subId>.<sig>` token for a SUBSCRIBER's (funnel) links. */
export function createSubscriberToken(subscriberId: string): string {
  const payload = `${SUB_PREFIX}${subscriberId}`;
  return `${payload}.${sign(payload)}`;
}

/**
 * Verify a BUYER token and return the userId it authorises, or null if the
 * signature doesn't match (tampered, truncated, or signed with a different
 * secret). Rejects subscriber tokens (`sub.` prefix).
 */
export function verifyToken(token: string | null | undefined): string | null {
  if (!token || token.startsWith(SUB_PREFIX)) return null;
  const dot = token.indexOf("."); // UUID + base64url sig contain no "."
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  return safeEqual(sig, sign(userId)) ? userId : null;
}

/**
 * Verify a SUBSCRIBER token and return the subscriberId, or null. The signed
 * payload includes the `sub.` prefix so a buyer token can never be replayed as
 * a subscriber token (different signed bytes).
 */
export function verifySubscriberToken(token: string | null | undefined): string | null {
  if (!token || !token.startsWith(SUB_PREFIX)) return null;
  const rest = token.slice(SUB_PREFIX.length);
  const dot = rest.indexOf(".");
  if (dot <= 0) return null;
  const subId = rest.slice(0, dot);
  const sig = rest.slice(dot + 1);
  return safeEqual(sig, sign(`${SUB_PREFIX}${subId}`)) ? subId : null;
}

/** Audience-agnostic verify for the unsubscribe route. */
export function verifyAnyToken(
  token: string | null | undefined,
): { kind: "user"; id: string } | { kind: "subscriber"; id: string } | null {
  const subId = verifySubscriberToken(token);
  if (subId) return { kind: "subscriber", id: subId };
  const userId = verifyToken(token);
  if (userId) return { kind: "user", id: userId };
  return null;
}
