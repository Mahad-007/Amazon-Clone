/**
 * Order maths, kept out of the "use server" module on purpose: a file with
 * the "use server" directive may only export async functions, so exporting a
 * plain helper from it silently strips every export and breaks the import.
 */

/** Free over $35, otherwise a flat rate — mirrors Amazon's US threshold. */
export const FREE_SHIPPING_THRESHOLD = 3500;
export const FLAT_SHIPPING = 599;
export const TAX_RATE = 0.0725;

export function quote(subtotalCents: number): {
  shipping: number;
  tax: number;
  total: number;
} {
  const shipping = subtotalCents >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const tax = Math.round(subtotalCents * TAX_RATE);
  return { shipping, tax, total: subtotalCents + shipping + tax };
}
