"use server";

import { revalidatePath } from "next/cache";
import { getProduct } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

/** Returns the new state: true if the item is now on the list. */
export async function toggleWishlist(asin: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await getProduct(asin))) return false;

  const { data: existing } = await supabase
    .from("list_items")
    .select("asin")
    .eq("asin", asin)
    .maybeSingle();

  if (existing) {
    await supabase.from("list_items").delete().eq("asin", asin);
    revalidatePath("/wishlist");
    return false;
  }

  await supabase.from("list_items").insert({ user_id: user.id, asin });
  revalidatePath("/wishlist");
  return true;
}
