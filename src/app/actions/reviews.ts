"use server";

import { revalidatePath, updateTag } from "next/cache";
import { CATALOG_TAG, getProduct } from "@/lib/catalog";
import { cleanReview, upsertReview } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = { ok: boolean; error: string | null };

/**
 * The review form posts here directly, so it works with JavaScript off:
 * the page re-renders with this state and the new review in the list.
 */
export async function postReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to review." };

  const asin = String(formData.get("asin") ?? "");
  if (!(await getProduct(asin))) return { ok: false, error: "That product doesn't exist." };

  const review = cleanReview({
    rating: Number(formData.get("rating")),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
  if (!review.ok) return { ok: false, error: review.error };

  try {
    await upsertReview(supabase, asin, review.value);
  } catch {
    return { ok: false, error: "Could not save your review." };
  }

  // The review moved the product's blended rating, which every cached shelf
  // and search result shows, so expire the whole catalogue tag.
  updateTag(CATALOG_TAG);
  revalidatePath(`/product/${asin}`);
  return { ok: true, error: null };
}
