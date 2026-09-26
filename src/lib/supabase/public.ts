import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, assertConfigured } from "./config";
import type { Db } from "./server";
import type { Database } from "./database.types";

let client: Db | null = null;

/**
 * A cookie-less anon client for public data (products, categories, reviews).
 * It never sees a session, so its results are identical for every visitor
 * and safe to put in the shared data cache. RLS still applies: anon can read
 * the catalogue and nothing else.
 */
export function publicDb(): Db {
  assertConfigured();
  client ??= createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
