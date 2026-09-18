"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { readCart } from "@/lib/cart";
import { getProduct } from "@/lib/catalog";
import { quote } from "@/lib/pricing";

export type CheckoutState = { error: string | null };

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Checkout is unavailable right now." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?next=/checkout");

  const lines = (await readCart()).filter((l) => !l.saved);
  if (lines.length === 0) return { error: "Your cart is empty." };

  const items = lines
    .map((l) => ({ line: l, product: getProduct(l.asin) }))
    .filter((x) => x.product);

  if (items.length === 0) return { error: "Your cart is empty." };

  const shipTo = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    line1: String(formData.get("line1") ?? "").trim(),
    line2: String(formData.get("line2") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim(),
    postalCode: String(formData.get("postalCode") ?? "").trim(),
    country: "United States",
    phone: String(formData.get("phone") ?? "").trim(),
  };

  for (const [field, label] of [
    ["fullName", "full name"],
    ["line1", "street address"],
    ["city", "city"],
    ["postalCode", "ZIP code"],
  ] as const) {
    if (!shipTo[field]) return { error: `Please enter your ${label}.` };
  }

  const subtotal = items.reduce(
    (n, x) => n + x.product!.priceCents * x.line.qty,
    0,
  );
  const { shipping, tax, total } = quote(subtotal);

  // Everything Prime arrives in 2 days, everything else in 5.
  const anySlow = items.some((x) => !x.product!.isPrime);
  const arrives = new Date();
  arrives.setDate(arrives.getDate() + (anySlow ? 5 : 2));

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      tax_cents: tax,
      total_cents: total,
      ship_to: shipTo,
      payment_last4: String(formData.get("card") ?? "4242").slice(-4) || "4242",
      arrives_on: arrives.toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: "We couldn't place your order. Please try again." };
  }

  // Line items snapshot title/image/price: the catalogue may change later,
  // but an order must always show what was actually bought.
  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((x) => ({
      order_id: order.id,
      asin: x.product!.asin,
      title: x.product!.title,
      image_url: x.product!.image,
      price_cents: x.product!.priceCents,
      qty: x.line.qty,
    })),
  );

  if (itemsError) {
    // Don't strand a header with no lines.
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: "We couldn't place your order. Please try again." };
  }

  await supabase.from("cart_items").delete().eq("user_id", user.id);

  // The cart badge lives in the root layout, so revalidating a single path
  // leaves a stale count on every other route. "layout" scope busts the
  // whole tree — without it the header still shows items after checkout.
  revalidatePath("/", "layout");

  redirect(`/orders/${order.id}?placed=1`);
}
