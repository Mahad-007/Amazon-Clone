/**
 * Shipping-address validation shared by the checkout form (server action)
 * and POST /api/v1/orders. place_order() re-checks the required fields in
 * SQL; this layer exists to give the shopper a specific message.
 */
export type ShipTo = {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
};

const REQUIRED: [keyof ShipTo, string][] = [
  ["fullName", "full name"],
  ["line1", "street address"],
  ["city", "city"],
  ["postalCode", "ZIP code"],
];

export function parseShipTo(
  get: (key: keyof ShipTo) => unknown,
): { ok: true; value: ShipTo } | { ok: false; error: string; field: keyof ShipTo } {
  const read = (key: keyof ShipTo) => String(get(key) ?? "").trim();
  const value: ShipTo = {
    fullName: read("fullName"),
    line1: read("line1"),
    line2: read("line2"),
    city: read("city"),
    state: read("state"),
    postalCode: read("postalCode"),
    phone: read("phone"),
  };
  for (const [field, label] of REQUIRED) {
    if (!value[field]) return { ok: false, error: `Please enter your ${label}.`, field };
  }
  return { ok: true, value };
}

/** Maps place_order()'s raised exceptions to shopper-facing messages. */
export function orderErrorMessage(message: string | undefined): { code: string; message: string } {
  if (message?.includes("cart_empty")) return { code: "cart_empty", message: "Your cart is empty." };
  if (message?.includes("address_incomplete")) {
    return { code: "address_incomplete", message: "Please complete your shipping address." };
  }
  if (message?.includes("not_authenticated")) {
    return { code: "unauthenticated", message: "Please sign in to check out." };
  }
  return { code: "order_failed", message: "We couldn't place your order. Please try again." };
}
