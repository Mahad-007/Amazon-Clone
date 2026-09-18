import "server-only";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import type { CartLine } from "./types";

export const CART_COOKIE = "amz_cart";

/**
 * Two backends, one shape.
 *
 * Guests keep their cart in a cookie, which is what amazon.com does too —
 * you can fill a basket before you ever sign in. Signed-in shoppers get the
 * Postgres cart so it follows them between devices. `mergeGuestCart` folds
 * the former into the latter at sign-in so nothing is lost.
 */

function parseCookieCart(value: string | undefined): CartLine[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is CartLine =>
          typeof l?.asin === "string" && Number.isFinite(l?.qty),
      )
      .map((l) => ({
        asin: l.asin,
        qty: Math.max(1, Math.min(30, Math.trunc(l.qty))),
        saved: Boolean(l.saved),
      }));
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

/** The current shopper's cart, whichever backend it lives in. */
export async function readCart(): Promise<CartLine[]> {
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("cart_items")
        .select("asin, qty, saved")
        .order("added_at", { ascending: false });

      return (data ?? []).map((r) => ({
        asin: r.asin as string,
        qty: r.qty as number,
        saved: r.saved as boolean,
      }));
    }
  }

  return readGuestCart();
}

/** Item count for the header badge — saved-for-later items don't count. */
export async function cartCount(): Promise<number> {
  const lines = await readCart();
  return lines.filter((l) => !l.saved).reduce((n, l) => n + l.qty, 0);
}

/**
 * Called right after sign-in/sign-up. Quantities are summed rather than
 * overwritten, so adding two of something as a guest and one as a user
 * leaves three in the cart.
 */
export async function mergeGuestCart(userId: string): Promise<void> {
  const guest = await readGuestCart();
  if (guest.length === 0) return;

  const supabase = await createClient();
  if (!supabase) return;

  const { data: existing } = await supabase
    .from("cart_items")
    .select("asin, qty");

  const current = new Map(
    (existing ?? []).map((r) => [r.asin as string, r.qty as number]),
  );

  const rows = guest.map((l) => ({
    user_id: userId,
    asin: l.asin,
    qty: Math.min(30, (current.get(l.asin) ?? 0) + l.qty),
    saved: l.saved,
  }));

  await supabase.from("cart_items").upsert(rows, { onConflict: "user_id,asin" });

  const jar = await cookies();
  jar.delete(CART_COOKIE);
}
