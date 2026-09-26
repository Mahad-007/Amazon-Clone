"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { orderErrorMessage, parseShipTo } from "@/lib/validation";

/** Fields echoed back on failure, so an error never wipes the typed address. */
const ECHOED = ["fullName", "phone", "line1", "line2", "city", "state", "postalCode", "nameOnCard"] as const;
export type CheckoutValues = Partial<Record<(typeof ECHOED)[number], string>>;

export type CheckoutState = { error: string | null; values?: CheckoutValues };

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

  // React resets uncontrolled fields once a form action finishes, even when
  // it returns an error. Hand the address back to re-seed them. The card
  // number is deliberately not echoed.
  const values: CheckoutValues = Object.fromEntries(
    ECHOED.map((key) => [key, String(formData.get(key) ?? "").slice(0, 200)]),
  );

  const shipTo = parseShipTo((key) => formData.get(key));
  if (!shipTo.ok) return { error: shipTo.error, values };

  const { data: orderId, error } = await supabase.rpc("place_order", {
    p_ship_to: shipTo.value,
    p_payment_last4: String(formData.get("card") ?? ""),
  });
  if (error || !orderId) return { error: orderErrorMessage(error?.message).message, values };

  // The cart badge lives in the root layout, so revalidating a single path
  // would leave a stale count on every other route.
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}?placed=1`);
}
