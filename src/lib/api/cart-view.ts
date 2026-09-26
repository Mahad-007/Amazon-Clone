import "server-only";
import { getProducts } from "../catalog";
import { readDbCart } from "../cart";
import { quote } from "../pricing";
import type { Db } from "../supabase/server";

/** The signed-in cart with products attached and totals for active lines. */
export async function cartView(db: Db) {
  const lines = await readDbCart(db);
  const products = new Map((await getProducts(lines.map((l) => l.asin))).map((p) => [p.asin, p]));
  const withProducts = lines
    .filter((l) => products.has(l.asin))
    .map((l) => ({ ...l, product: products.get(l.asin)! }));

  const active = withProducts.filter((l) => !l.saved);
  const subtotalCents = active.reduce((n, l) => n + l.product.priceCents * l.qty, 0);
  const { shipping, tax, total } = quote(subtotalCents);

  return {
    lines: withProducts,
    count: active.reduce((n, l) => n + l.qty, 0),
    subtotalCents,
    shippingCents: active.length ? shipping : 0,
    taxCents: tax,
    totalCents: active.length ? total : 0,
  };
}
