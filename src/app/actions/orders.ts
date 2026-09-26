"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { orderErrorMessage, parseShipTo } from "@/lib/validation";

export type CheckoutState = { error: string | null };

/**
 * Checkout is one call to the place_order() SQL function. It prices every
 * line from the products table, writes the order and its line items and
 * clears the cart in a single transaction, so there is no half-written order
 * to clean up and nothing the browser sends can change a price.
 */
export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?next=/checkout");

  const shipTo = parseShipTo((key) => formData.get(key));
  if (!shipTo.ok) return { error: shipTo.error };

  const { data: orderId, error } = await supabase.rpc("place_order", {
    p_ship_to: shipTo.value,
    p_payment_last4: String(formData.get("card") ?? ""),
  });
  if (error || !orderId) return { error: orderErrorMessage(error?.message).message };

  // The cart badge lives in the root layout, so revalidating a single path
  // would leave a stale count on every other route.
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}?placed=1`);
}
