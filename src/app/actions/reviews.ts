"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

export async function submitReview(input: {
  asin: string;
  rating: number;
  title: string;
  body: string;
}): Promise<Result> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, error: "Reviews are unavailable right now." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Please sign in to review." };

  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) {
    return { ok: false, error: "Pick a rating between 1 and 5 stars." };
  }

  const title = input.title.trim().slice(0, 120);
  const body = input.body.trim().slice(0, 2000);
  if (body.length < 4) {
    return { ok: false, error: "Please write a little more." };
  }

  const name =
    (user.user_metadata?.name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Amazon Customer";

  // One review per customer per product; writing again updates the old one.
  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: user.id,
      asin: input.asin,
      rating,
      title: title || "Review",
      body,
      author_name: name,
    },
    { onConflict: "user_id,asin" },
  );

  if (error) return { ok: false, error: "Could not save your review." };

  revalidatePath(`/product/${input.asin}`);
  return { ok: true };
}
