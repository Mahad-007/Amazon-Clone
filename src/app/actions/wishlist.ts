"use server";

import { revalidatePath } from "next/cache";
import { getProduct } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

/**
 * Form action: puts an item on the list (save=1) or takes it off (save=0).
 * Setting a state rather than toggling keeps a double submit harmless, and
 * as a plain form post it works without JavaScript.
 */
export async function setWishlist(formData: FormData): Promise<void> {
  const asin = String(formData.get("asin") ?? "");
  const save = formData.get("save") === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await getProduct(asin))) return;

  // RLS scopes list_items to the caller, so these only touch their own row.
  if (save) {
    await supabase.from("list_items").upsert({ user_id: user.id, asin }, { onConflict: "user_id,asin", ignoreDuplicates: true });
  } else {
    await supabase.from("list_items").delete().eq("asin", asin);
  }
  revalidatePath("/wishlist");
  revalidatePath(`/product/${asin}`);
}
