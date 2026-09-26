/**
 * Money is integer cents everywhere. `money` formats a whole string;
 * `splitPrice` returns the parts for the display layout with raised cents.
 */
export function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function splitPrice(cents: number): {
  symbol: string;
  whole: string;
  fraction: string;
} {
  const fixed = (cents / 100).toFixed(2);
  const [whole, fraction] = fixed.split(".");
  return {
    symbol: "$",
    whole: Number(whole).toLocaleString("en-US"),
    fraction,
  };
}

export function percentOff(priceCents: number, listCents: number): number {
  if (listCents <= priceCents) return 0;
  return Math.round(((listCents - priceCents) / listCents) * 100);
}

/** "2K+" — abbreviated "bought in past month" figure. */
export function compactCount(n: number): string {
  if (n >= 10_000) return `${Math.floor(n / 1000)}K+`;
  if (n >= 1_000) return `${Math.floor(n / 1000)}K+`;
  return `${n}+`;
}

export function reviewCount(n: number): string {
  return n.toLocaleString("en-US");
}

const WEEKDAY: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
};

export function deliveryDate(daysFromNow: number, from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

export function formatDelivery(d: Date): string {
  return d.toLocaleDateString("en-US", WEEKDAY);
}

/** "September 18, 2026" — used on order cards. */
export function formatDay(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Order numbers render as 3-7-7 digit groups derived from the order's uuid. */
export function orderNumber(id: string): string {
  const digits = id.replace(/\D/g, "").padEnd(17, "0");
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10, 17)}`;
}
