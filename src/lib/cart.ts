import "server-only";
import { cookies } from "next/headers";
import { getProducts } from "./catalog";
import { createClient, type Db } from "./supabase/server";
import type { CartLine } from "./types";

// Internal cookie name, kept from the first version so existing guest carts
// survive the rebrand. Shoppers never see it.
export const CART_COOKIE = "amz_cart";
export const MAX_QTY = 30;

/**
 * Two backends, one shape.
 *
 * Guests keep their cart in a cookie, so they can fill a basket before they
 * ever sign in. Signed-in shoppers get the Postgres cart, which follows them
 * between devices and is what the REST API reads. `mergeGuestCart` folds the
 * former into the latter at sign-in so nothing is lost.
 */

// ------------------------------------------------------ pure line transforms

/** 1..MAX_QTY, and never more than the product has in stock. */
export const clampQty = (n: number, stock = MAX_QTY) =>
  Math.max(1, Math.min(MAX_QTY, stock, Math.trunc(n)));

export function withAdded(lines: CartLine[], asin: string, qty: number, stock = MAX_QTY): CartLine[] {
  const existing = lines.find((l) => l.asin === asin);
  if (existing) {
    return lines.map((l) =>
      l.asin === asin ? { ...l, qty: clampQty(l.qty + qty, stock), saved: false } : l,
    );
  }
  return [{ asin, qty: clampQty(qty, stock), saved: false }, ...lines];
}

export function withQty(lines: CartLine[], asin: string, qty: number, stock = MAX_QTY): CartLine[] {
  if (Math.trunc(qty) <= 0) return withoutLine(lines, asin);
  return lines.map((l) => (l.asin === asin ? { ...l, qty: clampQty(qty, stock) } : l));
}

export function withSaved(lines: CartLine[], asin: string, saved: boolean): CartLine[] {
  return lines.map((l) => (l.asin === asin ? { ...l, saved } : l));
}

export function withoutLine(lines: CartLine[], asin: string): CartLine[] {
  return lines.filter((l) => l.asin !== asin);
}

// ------------------------------------------------------------- guest cookie

function parseCookieCart(value: string | undefined): CartLine[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l): l is CartLine => typeof l?.asin === "string" && Number.isFinite(l?.qty))
      .map((l) => ({ asin: l.asin, qty: clampQty(l.qty), saved: Boolean(l.saved) }));
  } catch {
    // A malformed cookie must never break the page — treat it as empty.
    return [];
  }
}

export async function readGuestCart(): Promise<CartLine[]> {
  const jar = await cookies();
  return parseCookieCart(jar.get(CART_COOKIE)?.value);
}

export async function writeGuestCart(lines: CartLine[]): Promise<void> {
  const jar = await cookies();
  jar.set(CART_COOKIE, JSON.stringify(lines), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

// ---------------------------------------------------------- Postgres cart

/** RLS scopes cart_items to the client's user. */
export async function readDbCart(db: Db): Promise<CartLine[]> {
  const { data, error } = await db
    .from("cart_items")
    .select("asin, qty, saved")
    .order("added_at", { ascending: false });
  if (error) throw new Error(`cart: read failed: ${error.message}`);
  return (data ?? []).map((r) => ({ asin: r.asin, qty: r.qty, saved: r.saved }));
}

/*
 * Each write is a single statement on the one line it touches. The old
 * read-modify-write of the whole cart lost items when two adds raced, and
 * could resurrect a line that place_order() had just checked out.
 */

/** Adds (or increments) a line; cart_add() caps it at 30 and at stock. */
export async function addDbLine(db: Db, asin: string, qty: number): Promise<void> {
  const { error } = await db.rpc("cart_add", { p_asin: asin, p_qty: qty });
  if (error) throw new Error(`cart: add failed: ${error.message}`);
}

/** Returns false when the shopper has no such line. */
export async function updateDbLine(
  db: Db,
  asin: string,
  patch: { qty?: number; saved?: boolean },
): Promise<boolean> {
  const { data, error } = await db.from("cart_items").update(patch).eq("asin", asin).select("asin");
  if (error) throw new Error(`cart: update failed: ${error.message}`);
  return (data ?? []).length > 0;
}

/** Returns false when the shopper has no such line. */
export async function removeDbLine(db: Db, asin: string): Promise<boolean> {
  const { data, error } = await db.from("cart_items").delete().eq("asin", asin).select("asin");
  if (error) throw new Error(`cart: delete failed: ${error.message}`);
  return (data ?? []).length > 0;
}

// ---------------------------------------------------------- either backend

/** The current shopper's cart, whichever backend it lives in. */
export async function readCart(): Promise<CartLine[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? readDbCart(supabase) : readGuestCart();
}

/** Item count for the header badge — saved-for-later items don't count. */
export async function cartCount(): Promise<number> {
  const lines = await readCart();
  return lines.filter((l) => !l.saved).reduce((n, l) => n + l.qty, 0);
}

/**
 * Called right after sign-in/sign-up. Quantities are summed rather than
 * overwritten, so adding two of something as a guest and one as a user
 * leaves three in the cart. Lines for products that no longer exist are
 * dropped: the cookie is client-controlled and the table has a foreign key.
 */
export async function mergeGuestCart(): Promise<void> {
  const guest = await readGuestCart();
  if (guest.length === 0) return;

  const known = new Set((await getProducts(guest.map((l) => l.asin))).map((p) => p.asin));
  const supabase = await createClient();
  for (const line of guest.filter((g) => known.has(g.asin))) {
    await addDbLine(supabase, line.asin, line.qty);
    if (line.saved) await updateDbLine(supabase, line.asin, { saved: true });
  }

  const jar = await cookies();
  jar.delete(CART_COOKIE);
}
