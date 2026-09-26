import "server-only";
import { unstable_cache } from "next/cache";
import { CATALOG_TAG } from "./catalog";
import { publicDb } from "./supabase/public";
import type { Db } from "./supabase/server";
import type { Histogram, Review } from "./types";

/**
 * Reviews are real rows written by HAUL shoppers; nothing here is generated.
 * Each write fires a trigger (0004_catalog_links.sql) that folds the review
 * into the product's blended rating, so reads share the catalogue cache tag.
 */

const BUILD = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";

/** A review plus its author id, which only the server uses (to mark "mine"). */
export type StoredReview = Review & { userId: string };

type ReviewRow = {
  id: string;
  user_id: string;
  asin: string;
  rating: number;
  title: string;
  body: string;
  author_name: string;
  created_at: string;
};

function toReview(r: ReviewRow): StoredReview {
  return {
    id: r.id,
    userId: r.user_id,
    asin: r.asin,
    rating: r.rating,
    title: r.title,
    body: r.body,
    authorName: r.author_name,
    createdAt: r.created_at,
  };
}

/** Strips the author id before a review leaves the server. */
export function publicReview({ userId: _userId, ...review }: StoredReview): Review {
  return review;
}

export const listReviews = unstable_cache(
  async (asin: string, limit = 20, offset = 0): Promise<{ items: StoredReview[]; total: number }> => {
    const { data, error, count } = await publicDb()
      .from("reviews")
      .select("*", { count: "exact" })
      .eq("asin", asin)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`reviews: list failed: ${error.message}`);
    return { items: (data ?? []).map(toReview), total: count ?? 0 };
  },
  ["reviews", "list", BUILD],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export const reviewHistogram = unstable_cache(
  async (asin: string): Promise<Histogram> => {
    const { data, error } = await publicDb()
      .from("review_histogram")
      .select("stars, count")
      .eq("asin", asin);
    if (error) throw new Error(`reviews: histogram failed: ${error.message}`);

    const counts = new Map((data ?? []).map((r) => [r.stars ?? 0, r.count ?? 0]));
    const total = [...counts.values()].reduce((n, c) => n + c, 0);
    const rows = [5, 4, 3, 2, 1].map((stars) => {
      const count = counts.get(stars) ?? 0;
      return { stars, count, exact: total ? (count / total) * 100 : 0 };
    });

    // Largest-remainder rounding so the bars always sum to exactly 100%.
    const floored = rows.map((r) => Math.floor(r.exact));
    let left = total ? 100 - floored.reduce((n, v) => n + v, 0) : 0;
    const order = rows
      .map((r, i) => ({ i, rem: r.exact - floored[i] }))
      .sort((a, b) => b.rem - a.rem);
    for (const { i } of order) {
      if (left <= 0) break;
      floored[i] += 1;
      left -= 1;
    }
    return rows.map((r, i) => ({ stars: r.stars, count: r.count, pct: floored[i] }));
  },
  ["reviews", "histogram", BUILD],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export type ReviewInput = { rating: number; title: string; body: string };

/** Validates a review; returns the cleaned input or a message for the shopper. */
export function cleanReview(input: ReviewInput): { ok: true; value: ReviewInput } | { ok: false; error: string } {
  const rating = Math.round(Number(input.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Pick a rating between 1 and 5 stars." };
  }
  const title = String(input.title ?? "").trim().slice(0, 120);
  const body = String(input.body ?? "").trim().slice(0, 2000);
  if (body.length < 4) return { ok: false, error: "Please write a little more." };
  return { ok: true, value: { rating, title: title || "Review", body } };
}

/** One review per shopper per product; writing again replaces the old one. */
export async function upsertReview(
  db: Db,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  asin: string,
  input: ReviewInput,
): Promise<StoredReview> {
  const name =
    (user.user_metadata?.name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "HAUL Customer";

  const { data, error } = await db
    .from("reviews")
    .upsert(
      { user_id: user.id, asin, ...input, author_name: name, created_at: new Date().toISOString() },
      { onConflict: "user_id,asin" },
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(`reviews: save failed: ${error?.message}`);
  return toReview(data);
}

export async function deleteReview(db: Db, userId: string, asin: string): Promise<boolean> {
  const { data, error } = await db
    .from("reviews")
    .delete()
    .eq("user_id", userId)
    .eq("asin", asin)
    .select("id");
  if (error) throw new Error(`reviews: delete failed: ${error.message}`);
  return (data ?? []).length > 0;
}
