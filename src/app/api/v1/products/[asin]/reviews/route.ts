import { revalidateTag } from "next/cache";
import { authenticate, fail, intParam, mine, notFound, ok, readJson, handler } from "@/lib/api/http";
import { CATALOG_TAG, getProduct } from "@/lib/catalog";
import {
  cleanReview,
  listReviews,
  reviewHistogram,
  upsertReview,
  type ReviewInput,
} from "@/lib/reviews";

type Ctx = { params: Promise<{ asin: string }> };

async function handleGET(request: Request, { params }: Ctx) {
  const product = await getProduct((await params).asin);
  if (!product) return notFound("Product");

  const limit = intParam(request.url, "limit", 20, 1, 50);
  const offset = intParam(request.url, "offset", 0, 0, 10_000);
  const [page, histogram] = await Promise.all([
    listReviews(product.asin, limit, offset),
    reviewHistogram(product.asin),
  ]);
  return ok({
    rating: product.rating,
    reviewCount: product.reviewCount,
    haulReviewCount: product.haulReviewCount,
    histogram,
    total: page.total,
    items: page.items,
  });
}

/** Create or replace the caller's review. It moves the product's rating. */
async function handlePOST(request: Request, { params }: Ctx) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;

  const product = await getProduct((await params).asin);
  if (!product) return notFound("Product");

  const json = await readJson<Partial<ReviewInput>>(request);
  if ("error" in json) return json.error;

  const review = cleanReview({
    rating: Number(json.body.rating),
    title: String(json.body.title ?? ""),
    body: String(json.body.body ?? ""),
  });
  if (!review.ok) return fail(422, "invalid_review", review.error);

  const saved = await upsertReview(auth.db, product.asin, review.value);
  revalidateTag(CATALOG_TAG, { expire: 0 });
  return mine(saved, 201);
}

export const GET = handler(handleGET);
export const POST = handler(handlePOST);
