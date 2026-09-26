/**
 * Supabase is the backend: the catalogue, search, carts, orders and reviews
 * all live in Postgres. There is no offline fallback any more, so a missing
 * env var fails loudly with a message that says what to set.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export function assertConfigured(): void {
  if (supabaseConfigured) return;
  throw new Error(
    "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).",
  );
}
