import { intParam, notFound, ok, preflight, handler } from "@/lib/api/http";
import { alsoViewed, getProduct, related } from "@/lib/catalog";

export const OPTIONS = preflight;

/** kind=category (default): same department by popularity; kind=price: nearest price. */
async function handleGET(request: Request, { params }: { params: Promise<{ asin: string }> }) {
  const product = await getProduct((await params).asin);
  if (!product) return notFound("Product");

  const limit = intParam(request.url, "limit", 12, 1, 48);
  const kind = new URL(request.url).searchParams.get("kind") === "price" ? "price" : "category";
  const items =
    kind === "price"
      ? await alsoViewed(product.asin, limit)
      : await related(product.asin, product.category, limit);
  return ok({ kind, items });
}

export const GET = handler(handleGET);
