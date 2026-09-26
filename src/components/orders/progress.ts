import type { Order } from "@/lib/types";

export const STEPS = ["Ordered", "Packed", "Shipped", "Delivered"] as const;

/**
 * Where an order is on its way, as an index into STEPS.
 *
 * Orders are only ever written with status "confirmed" (there is no
 * warehouse), so progress is derived from the clock: packed a few hours
 * after ordering, shipped part-way to the promised date, delivered once
 * that date has passed. An explicit status always wins.
 */
export function stepIndex(order: Pick<Order, "status" | "placedAt" | "arrivesOn">, now = new Date()): number {
  if (order.status === "delivered") return 3;
  if (order.status === "shipped") return 2;

  const placed = new Date(order.placedAt).getTime();
  // arrivesOn is a date; treat delivery as happening by the end of that day.
  const arrives = new Date(`${order.arrivesOn}T23:59:59`).getTime();
  const t = now.getTime();

  if (t >= arrives) return 3;
  const fraction = (t - placed) / Math.max(arrives - placed, 1);
  if (fraction >= 0.45) return 2;
  if (t - placed >= 4 * 60 * 60 * 1000) return 1;
  return 0;
}
