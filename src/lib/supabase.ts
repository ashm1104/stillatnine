// Supabase client helpers for Still at Nine.
//
// Two clients, two trust levels:
//   - `supabase`            — anon key, safe for the browser / client components.
//   - `createAdminClient()` — service-role key, server-only. Bypasses RLS, so
//                             NEVER import this into a client component.
//
// All clients are typed against the generated `Database` schema.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type Client = SupabaseClient<Database>;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) {
  throw new Error("Missing env var NEXT_PUBLIC_SUPABASE_URL");
}
if (!anonKey) {
  throw new Error("Missing env var NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * Anon-key client. Subject to Row Level Security. Use from anywhere,
 * including the browser.
 */
export const supabase: Client = createClient<Database>(url, anonKey);

/**
 * Service-role client. Bypasses RLS — server-side only (API routes,
 * webhooks, server components). Reads the key lazily so importing this
 * module on the client doesn't blow up at build time.
 */
export function createAdminClient(): Client {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing env var SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(url!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
