import "server-only";
import { createClient as createSupabase, type User } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, assertConfigured } from "../supabase/config";
import { createClient as createCookieClient, type Db } from "../supabase/server";
import type { Database } from "../supabase/database.types";
import type { RawParams } from "../search-params";

/**
 * Shared plumbing for the /api/v1 route handlers.
 *
 * Errors always have the same shape, `{ error: { code, message } }`, so a
 * client can branch on `code` without parsing prose.
 */

const PUBLIC_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
  "Access-Control-Allow-Origin": "*",
};
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

/** A public, CDN-cacheable JSON response (catalogue reads). */
export function ok(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: PUBLIC_HEADERS });
}

/** A per-user JSON response that must never be cached or shared. */
export function mine(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: PRIVATE_HEADERS });
}

export function noContent(): Response {
  return new Response(null, { status: 204, headers: PRIVATE_HEADERS });
}

export function fail(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status, headers: PRIVATE_HEADERS });
}

export const notFound = (what = "Resource") => fail(404, "not_found", `${what} not found.`);

/**
 * Wraps a route handler so an unexpected throw still answers in the
 * documented error shape instead of an empty 500.
 */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response> | Response) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error("api:", error);
      return fail(500, "internal_error", "Something went wrong on our side.");
    }
  };
}

/** CORS preflight for the public read endpoints. */
export function preflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

/**
 * Resolves the caller to a Supabase user and a client that acts as them.
 *
 *  - `Authorization: Bearer <access_token>`: the token Supabase Auth issues
 *    at sign-in, for scripts and other clients.
 *  - Otherwise the browser's session cookie, so the storefront itself can
 *    call the API.
 *
 * Either way the returned client carries the user's JWT, so Postgres RLS
 * decides what it may read and write, not this code.
 */
export async function authenticate(
  request: Request,
): Promise<{ user: User; db: Db } | { error: Response }> {
  assertConfigured();
  const header = request.headers.get("authorization") ?? "";
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1];

  if (token) {
    const db = createSupabase<Database>(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) return { error: fail(401, "unauthenticated", "Invalid or expired token.") };
    return { user: data.user, db };
  }

  const db = await createCookieClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) {
    return {
      error: fail(401, "unauthenticated", "Sign in, or send Authorization: Bearer <access_token>."),
    };
  }
  return { user, db };
}

/** Reads a JSON body, or returns a 400 response. */
export async function readJson<T = Record<string, unknown>>(
  request: Request,
): Promise<{ body: T } | { error: Response }> {
  try {
    const body = (await request.json()) as T;
    if (body === null || typeof body !== "object") throw new Error("not an object");
    return { body };
  } catch {
    return { error: fail(400, "invalid_json", "Request body must be a JSON object.") };
  }
}

/** URLSearchParams → the same RawParams shape the /s page parses. */
export function rawParams(url: string): RawParams {
  const out: RawParams = {};
  for (const [key, value] of new URL(url).searchParams) {
    const prev = out[key];
    out[key] = prev === undefined ? value : Array.isArray(prev) ? [...prev, value] : [prev, value];
  }
  return out;
}

/** An integer query param clamped to [min, max], or the fallback. */
export function intParam(url: string, key: string, fallback: number, min: number, max: number): number {
  const raw = new URL(url).searchParams.get(key);
  const n = raw == null ? NaN : Number(raw);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : fallback;
}

export const ASIN_RE = /^[A-Z0-9]{10}$/;
