/**
 * Supabase is optional at build time. The catalogue, search and a
 * cookie-backed guest cart all work without it; only identity, orders and
 * reviews need a database. Keeping that boundary explicit means a missing
 * env var degrades the app instead of crashing the build.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
