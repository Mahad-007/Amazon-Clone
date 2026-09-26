/**
 * Order maths, kept out of the "use server" module on purpose: a file with
 * the "use server" directive may only export async functions, so exporting a
 * plain helper from it silently strips every export and breaks the import.
 */

/**
 * Free over $35, otherwise a flat rate. The authoritative copy of these rules
 * is the place_order() SQL function, which prices real orders; this mirror
 * only renders cart and checkout totals, so the two must stay in step
 * (scripts/api-e2e.mjs asserts they agree).
 */
export const FREE_SHIPPING_THRESHOLD = 3500;
export const FLAT_SHIPPING = 599;
/** 7.25%, as basis points so the maths stays in integers like the SQL. */
export const TAX_BPS = 725;

export function quote(subtotalCents: number): {
  shipping: number;
  tax: number;
  total: number;
} {
  const shipping = subtotalCents >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const tax = Math.round((subtotalCents * TAX_BPS) / 10000);
  return { shipping, tax, total: subtotalCents + shipping + tax };
}
