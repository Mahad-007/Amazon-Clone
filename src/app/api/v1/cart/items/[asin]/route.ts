import { authenticate, fail, mine, notFound, readJson } from "@/lib/api/http";
import { cartView } from "@/lib/api/cart-view";
import { MAX_QTY, mutateDbCart, readDbCart, withQty, withSaved, withoutLine } from "@/lib/cart";

type Ctx = { params: Promise<{ asin: string }> };

/** Change quantity and/or move between the cart and "saved for later". */
export async function PATCH(request: Request, { params }: Ctx) {
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
  if (!(await readDbCart(auth.db)).some((l) => l.asin === asin)) return notFound("Cart line");

  await mutateDbCart(auth.db, auth.user.id, (lines) => {
    let next = lines;
    if (qty !== undefined) next = withQty(next, asin, qty as number);
    if (saved !== undefined) next = withSaved(next, asin, saved);
    return next;
  });
  return mine(await cartView(auth.db));
}

export async function DELETE(request: Request, { params }: Ctx) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;
  const { asin } = await params;

  if (!(await readDbCart(auth.db)).some((l) => l.asin === asin)) return notFound("Cart line");
  await mutateDbCart(auth.db, auth.user.id, (lines) => withoutLine(lines, asin));
  return mine(await cartView(auth.db));
}
