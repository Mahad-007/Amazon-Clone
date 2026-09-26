import { authenticate, fail, mine, notFound, readJson, handler } from "@/lib/api/http";
import { cartView } from "@/lib/api/cart-view";
import { MAX_QTY, addDbLine } from "@/lib/cart";
import { getProduct } from "@/lib/catalog";

/** Add to cart. Adding something already there increases its quantity (capped at 30 and stock). */
async function handlePOST(request: Request) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;

  const json = await readJson<{ asin?: unknown; qty?: unknown }>(request);
  if ("error" in json) return json.error;

  const qty = json.body.qty === undefined ? 1 : Number(json.body.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
    return fail(400, "invalid_qty", `qty must be an integer from 1 to ${MAX_QTY}.`);
  }
  const product = await getProduct(String(json.body.asin ?? ""));
  if (!product) return notFound("Product");

  await addDbLine(auth.db, product.asin, qty);
  return mine(await cartView(auth.db), 201);
}

export const POST = handler(handlePOST);
