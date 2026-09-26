import { authenticate, fail, mine, notFound, readJson, handler } from "@/lib/api/http";
import { cartView } from "@/lib/api/cart-view";
import { MAX_QTY, clampQty, removeDbLine, updateDbLine } from "@/lib/cart";
import { getProduct } from "@/lib/catalog";

type Ctx = { params: Promise<{ asin: string }> };

/** Change quantity and/or move between the cart and "saved for later". */
async function handlePATCH(request: Request, { params }: Ctx) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;
  const { asin } = await params;

  const json = await readJson<{ qty?: unknown; saved?: unknown }>(request);
  if ("error" in json) return json.error;
  const { qty, saved } = json.body;

  if (qty !== undefined && (!Number.isInteger(qty) || (qty as number) < 1 || (qty as number) > MAX_QTY)) {
    return fail(400, "invalid_qty", `qty must be an integer from 1 to ${MAX_QTY}.`);
  }
  if (saved !== undefined && typeof saved !== "boolean") {
    return fail(400, "invalid_saved", "saved must be a boolean.");
  }
  if (qty === undefined && saved === undefined) {
    return fail(400, "nothing_to_change", "Send qty and/or saved.");
  }
  const patch: { qty?: number; saved?: boolean } = {};
  if (qty !== undefined) patch.qty = clampQty(qty as number, (await getProduct(asin))?.stock);
  if (saved !== undefined) patch.saved = saved;
  if (!(await updateDbLine(auth.db, asin, patch))) return notFound("Cart line");
  return mine(await cartView(auth.db));
}

async function handleDELETE(request: Request, { params }: Ctx) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;
  const { asin } = await params;

  if (!(await removeDbLine(auth.db, asin))) return notFound("Cart line");
  return mine(await cartView(auth.db));
}

export const PATCH = handler(handlePATCH);
export const DELETE = handler(handleDELETE);
