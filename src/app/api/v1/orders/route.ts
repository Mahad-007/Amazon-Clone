import { authenticate, fail, mine, readJson } from "@/lib/api/http";
import { getOrder, listOrders } from "@/lib/orders";
import { orderErrorMessage, parseShipTo, type ShipTo } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;
  return mine({ items: await listOrders(auth.db) });
}

/**
 * Check out the caller's cart. Prices, shipping and tax are computed inside
 * the place_order() SQL function from the products table; the request only
 * says where to ship.
 */
export async function POST(request: Request) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;

  const json = await readJson<{ shipTo?: Partial<Record<keyof ShipTo, unknown>>; paymentLast4?: unknown }>(request);
  if ("error" in json) return json.error;

  const shipTo = parseShipTo((key) => json.body.shipTo?.[key]);
  if (!shipTo.ok) return fail(422, "invalid_address", shipTo.error);

  const { data: id, error } = await auth.db.rpc("place_order", {
    p_ship_to: shipTo.value,
    p_payment_last4: String(json.body.paymentLast4 ?? ""),
  });
  if (error || !id) {
    const { code, message } = orderErrorMessage(error?.message);
    const status = code === "cart_empty" ? 409 : code === "address_incomplete" ? 422 : 500;
    return fail(status, code, message);
  }
  return mine({ id, order: await getOrder(id, auth.db) }, 201);
}
