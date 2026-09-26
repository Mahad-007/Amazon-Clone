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

const clampQty = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.trunc(n)));

export function withAdded(lines: CartLine[], asin: string, qty: number): CartLine[] {
  const existing = lines.find((l) => l.asin === asin);
  if (existing) {
    return lines.map((l) =>
      l.asin === asin ? { ...l, qty: clampQty(l.qty + qty), saved: false } : l,
    );
  }
  return [{ asin, qty: clampQty(qty), saved: false }, ...lines];
}

export function withQty(lines: CartLine[], asin: string, qty: number): CartLine[] {
  if (Math.trunc(qty) <= 0) return withoutLine(lines, asin);
  return lines.map((l) => (l.asin === asin ? { ...l, qty: clampQty(qty) } : l));
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

/** Applies a transform to the signed-in cart and writes back the difference. */
export async function mutateDbCart(
  db: Db,
  userId: string,
  fn: (lines: CartLine[]) => CartLine[],
): Promise<CartLine[]> {
  const before = await readDbCart(db);
  const after = fn(before);

  const keep = new Set(after.map((l) => l.asin));
  const removed = before.map((l) => l.asin).filter((a) => !keep.has(a));
  if (removed.length > 0) {
    const { error } = await db.from("cart_items").delete().in("asin", removed);
    if (error) throw new Error(`cart: delete failed: ${error.message}`);
  }

  const changed = after.filter((l) => {
    const prev = before.find((b) => b.asin === l.asin);
    return !prev || prev.qty !== l.qty || prev.saved !== l.saved;
  });
  if (changed.length > 0) {
    const { error } = await db.from("cart_items").upsert(
      changed.map((l) => ({ user_id: userId, asin: l.asin, qty: l.qty, saved: l.saved })),
      { onConflict: "user_id,asin" },
    );
    if (error) throw new Error(`cart: write failed: ${error.message}`);
  }
  return after;
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
export async function mergeGuestCart(userId: string): Promise<void> {
  const guest = await readGuestCart();
  if (guest.length === 0) return;

  const known = new Set((await getProducts(guest.map((l) => l.asin))).map((p) => p.asin));
  const supabase = await createClient();
  await mutateDbCart(supabase, userId, (lines) =>
    guest
      .filter((g) => known.has(g.asin))
      .reduce((acc, g) => withSaved(withAdded(acc, g.asin, g.qty), g.asin, g.saved), lines),
  );

  const jar = await cookies();
  jar.delete(CART_COOKIE);
}
