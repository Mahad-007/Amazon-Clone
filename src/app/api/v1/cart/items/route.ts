import { authenticate, fail, mine, notFound, readJson } from "@/lib/api/http";
import { cartView } from "@/lib/api/cart-view";
import { MAX_QTY, mutateDbCart, withAdded } from "@/lib/cart";
import { getProduct } from "@/lib/catalog";

/** Add to cart. Adding something already there increases its quantity (capped). */
export async function POST(request: Request) {
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

  await mutateDbCart(auth.db, auth.user.id, (lines) => withAdded(lines, product.asin, qty));
  return mine(await cartView(auth.db), 201);
}
