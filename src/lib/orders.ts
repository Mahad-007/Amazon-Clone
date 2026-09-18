import "server-only";
import { createClient } from "./supabase/server";
import type { Order } from "./types";

type Row = Record<string, unknown>;

function toOrder(row: Row, items: Row[]): Order {
  return {
    id: row.id as string,
    placedAt: row.placed_at as string,
    status: row.status as Order["status"],
    subtotalCents: row.subtotal_cents as number,
    shippingCents: row.shipping_cents as number,
    taxCents: row.tax_cents as number,
    totalCents: row.total_cents as number,
    shipTo: row.ship_to as Order["shipTo"],
    paymentLast4: row.payment_last4 as string,
    arrivesOn: row.arrives_on as string,
    items: items.map((i) => ({
      asin: i.asin as string,
      title: i.title as string,
      imageUrl: i.image_url as string,
      priceCents: i.price_cents as number,
      qty: i.qty as number,
    })),
  };
}

/** RLS scopes these to the signed-in user; no explicit user filter needed. */
export async function listOrders(): Promise<Order[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("placed_at", { ascending: false })
    .limit(50);

  if (!orders || orders.length === 0) return [];

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .in(
      "order_id",
      orders.map((o) => o.id),
    );

  const byOrder = new Map<string, Row[]>();
  for (const item of items ?? []) {
    const list = byOrder.get(item.order_id as string) ?? [];
    list.push(item);
    byOrder.set(item.order_id as string, list);
  }

  return orders.map((o) => toOrder(o, byOrder.get(o.id as string) ?? []));
}

export async function getOrder(id: string): Promise<Order | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  return toOrder(order, items ?? []);
}
