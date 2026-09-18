"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { readGuestCart, writeGuestCart } from "@/lib/cart";
import type { CartLine } from "@/lib/types";

const MAX_QTY = 30;

/**
 * Every mutation routes through here so there is exactly one place that
 * knows whether the shopper is a guest (cookie) or signed in (Postgres).
 */
async function mutate(
  fn: (lines: CartLine[]) => CartLine[],
): Promise<void> {
  const supabase = await createClient();
  const user = supabase
    ? (await supabase.auth.getUser()).data.user
    : null;

  if (supabase && user) {
    const { data } = await supabase
      .from("cart_items")
      .select("asin, qty, saved");

    const before: CartLine[] = (data ?? []).map((r) => ({
      asin: r.asin as string,
      qty: r.qty as number,
      saved: r.saved as boolean,
    }));
    const after = fn(before);

    const beforeAsins = new Set(before.map((l) => l.asin));
    const afterAsins = new Set(after.map((l) => l.asin));

    const removed = [...beforeAsins].filter((a) => !afterAsins.has(a));
    if (removed.length > 0) {
      await supabase.from("cart_items").delete().in("asin", removed);
    }

    if (after.length > 0) {
      await supabase.from("cart_items").upsert(
        after.map((l) => ({
          user_id: user.id,
          asin: l.asin,
          qty: l.qty,
          saved: l.saved,
        })),
        { onConflict: "user_id,asin" },
      );
    }
  } else {
    await writeGuestCart(fn(await readGuestCart()));
  }

  // The header's cart badge renders in the root layout, so the whole tree
  // has to be revalidated or the count goes stale on other routes.
  revalidatePath("/", "layout");
}

export async function addToCart(asin: string, qty = 1): Promise<void> {
  await mutate((lines) => {
    const existing = lines.find((l) => l.asin === asin);
    if (existing) {
      return lines.map((l) =>
        l.asin === asin
          ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty), saved: false }
          : l,
      );
    }
    return [{ asin, qty: Math.min(MAX_QTY, qty), saved: false }, ...lines];
  });
}

export async function setQty(asin: string, qty: number): Promise<void> {
  const next = Math.trunc(qty);
  if (next <= 0) return removeFromCart(asin);

  await mutate((lines) =>
    lines.map((l) =>
      l.asin === asin ? { ...l, qty: Math.min(MAX_QTY, next) } : l,
    ),
  );
}

export async function removeFromCart(asin: string): Promise<void> {
  await mutate((lines) => lines.filter((l) => l.asin !== asin));
}

export async function saveForLater(asin: string): Promise<void> {
  await mutate((lines) =>
    lines.map((l) => (l.asin === asin ? { ...l, saved: true } : l)),
  );
}

export async function moveToCart(asin: string): Promise<void> {
  await mutate((lines) =>
    lines.map((l) => (l.asin === asin ? { ...l, saved: false } : l)),
  );
}

export async function clearCart(): Promise<void> {
  await mutate(() => []);
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
