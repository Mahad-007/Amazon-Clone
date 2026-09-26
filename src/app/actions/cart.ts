"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import {
  MAX_QTY,
  addDbLine,
  clampQty,
  readGuestCart,
  removeDbLine,
  updateDbLine,
  withAdded,
  withQty,
  withSaved,
  withoutLine,
  writeGuestCart,
} from "@/lib/cart";
import { createClient, type Db } from "@/lib/supabase/server";
import type { CartLine } from "@/lib/types";

/**
 * Every mutation routes through here so there is exactly one place that
 * knows whether the shopper is a guest (cookie) or signed in (Postgres).
 * Signed-in writes are single statements on one line (see lib/cart.ts).
 */
async function mutate(
  db: (db: Db) => Promise<unknown>,
  guest: (lines: CartLine[]) => CartLine[],
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) await db(supabase);
  else await writeGuestCart(guest(await readGuestCart()));

  // The header's cart badge renders in the root layout, so the whole tree
  // has to be revalidated or the count goes stale on other routes.
  revalidatePath("/", "layout");
}

export async function addToCart(asin: string, qty = 1): Promise<void> {
  // Only real products go in a cart; the form post is client-controlled.
  const product = await getProduct(asin);
  if (!product) return;
  await mutate(
    (db) => addDbLine(db, asin, qty),
    (lines) => withAdded(lines, asin, qty, product.stock),
  );
}

export async function setQty(asin: string, qty: number): Promise<void> {
  const stock = (await getProduct(asin))?.stock ?? MAX_QTY;
  await mutate(
    (db) => (qty <= 0 ? removeDbLine(db, asin) : updateDbLine(db, asin, { qty: clampQty(qty, stock) })),
    (lines) => withQty(lines, asin, qty, stock),
  );
}

export async function removeFromCart(asin: string): Promise<void> {
  await mutate(
    (db) => removeDbLine(db, asin),
    (lines) => withoutLine(lines, asin),
  );
}

export async function saveForLater(asin: string): Promise<void> {
  await mutate(
    (db) => updateDbLine(db, asin, { saved: true }),
    (lines) => withSaved(lines, asin, true),
  );
}

export async function moveToCart(asin: string): Promise<void> {
  await mutate(
    (db) => updateDbLine(db, asin, { saved: false }),
    (lines) => withSaved(lines, asin, false),
  );
}

/**
 * Form-post entry points.
 *
 * Rendering the cart controls as real <form>s posting to a server action means
 * they work before React hydrates — and with JavaScript disabled entirely.
 * Previously a click in the window between first paint and hydration was
 * silently dropped, which is a genuine (if brief) hole on a slow connection.
 */
function parse(formData: FormData): { asin: string; qty: number } {
  const asin = String(formData.get("asin") ?? "");
  const raw = Number(formData.get("qty") ?? 1);
  const qty = Number.isFinite(raw) ? Math.max(1, Math.min(MAX_QTY, Math.trunc(raw))) : 1;
  return { asin, qty };
}

export async function addToCartForm(formData: FormData): Promise<void> {
  const { asin, qty } = parse(formData);
  if (asin) await addToCart(asin, qty);
}

/** "Buy Now": add, then go straight to checkout. */
export async function buyNowForm(formData: FormData): Promise<void> {
  const { asin, qty } = parse(formData);
  if (asin) await addToCart(asin, qty);
  redirect("/checkout");
}

export async function removeFromCartForm(formData: FormData): Promise<void> {
  const asin = String(formData.get("asin") ?? "");
  if (asin) await removeFromCart(asin);
}

/** One entry point for the Save-for-later / Move-to-cart toggle. */
export async function toggleSavedForm(formData: FormData): Promise<void> {
  const asin = String(formData.get("asin") ?? "");
  if (!asin) return;
  if (String(formData.get("saved")) === "1") await moveToCart(asin);
  else await saveForLater(asin);
}

export async function setQtyForm(formData: FormData): Promise<void> {
  const asin = String(formData.get("asin") ?? "");
  const qty = Number(formData.get("qty") ?? 1);
  if (asin && Number.isFinite(qty)) await setQty(asin, Math.trunc(qty));
}
