"use server";

import { revalidatePath, updateTag } from "next/cache";
import { CATALOG_TAG, getProduct } from "@/lib/catalog";
import { cleanReview, upsertReview } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

export async function submitReview(input: {
  asin: string;
  rating: number;
  title: string;
  body: string;
}): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to review." };

  if (!(await getProduct(input.asin))) return { ok: false, error: "That product doesn't exist." };

  const review = cleanReview(input);
  if (!review.ok) return review;

  try {
    await upsertReview(supabase, user, input.asin, review.value);
  } catch {
    return { ok: false, error: "Could not save your review." };
  }

  // The review moved the product's blended rating, which every cached shelf
  // and search result shows, so expire the whole catalogue tag.
  updateTag(CATALOG_TAG);
  revalidatePath(`/product/${input.asin}`);
  return { ok: true };
}
