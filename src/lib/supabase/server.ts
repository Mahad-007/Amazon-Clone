import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, assertConfigured } from "./config";
import type { Database } from "./database.types";

export type Db = SupabaseClient<Database>;

/**
 * Server-side Supabase bound to the request's cookie jar, so RLS sees the
 * signed-in user. Use this for anything per-user; public catalogue reads go
 * through the cookie-less client in ./public so they can be cached.
 */
export async function createClient(): Promise<Db> {
  assertConfigured();
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Session refresh happens in the proxy instead.
        }
      },
    },
  });
}

/** The signed-in user, or null. Never throws on a missing session. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
