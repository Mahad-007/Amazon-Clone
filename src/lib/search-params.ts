import type { CategorySlug } from "./types";
import type { SearchParams, SortKey } from "./catalog";

/**
 * The URL is the single source of truth for search state: every filter is a
 * plain link, so results are server-rendered, shareable, and work with the
 * back button (and without JavaScript).
 */
export type RawParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const SORTS: SortKey[] = [
  "featured",
  "price-asc",
  "price-desc",
  "rating",
  "newest",
  "reviews",
];

export function parseParams(raw: RawParams): SearchParams & { page: number } {
  const brandRaw = raw.brand;
  const brands = Array.isArray(brandRaw)
    ? brandRaw
    : brandRaw
      ? brandRaw.split("|").filter(Boolean)
      : undefined;

  // URLs are user input: truncate and clamp every number before it reaches
  // an int parameter in SQL, where 1.5, 1e12 or -1e11 would be a 500.
  const num = (key: string, min: number, max: number) => {
    const v = Number(one(raw[key]));
    return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.trunc(v))) : undefined;
  };

  const sort = one(raw.sort) as SortKey | undefined;

  return {
    q: one(raw.q)?.slice(0, 200),
    category: (one(raw.c) as CategorySlug | "all" | undefined) ?? "all",
    brands,
    minPrice: num("min", 0, 100_000_000),
    maxPrice: num("max", 0, 100_000_000),
    minRating: num("rating", 0, 5),
    // `prime=1` is accepted so links shared before the rename keep working.
    expressOnly: one(raw.express) === "1" || one(raw.prime) === "1",
    dealsOnly: one(raw.deals) === "1",
    sort: sort && SORTS.includes(sort) ? sort : "featured",
    page: num("page", 1, 10_000) ?? 1,
  };
}

/**
 * Builds a search URL from the current params plus an override. Passing null
 * clears a key, and any change resets pagination — landing on page 4 of a
 * filter that now has two results is a classic e-commerce annoyance.
 */
export function buildUrl(
  current: RawParams,
  changes: Record<string, string | null>,
): string {
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(current)) {
    const v = one(value);
    if (v != null && v !== "") next.set(key, v);
  }

  for (const [key, value] of Object.entries(changes)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }

  if (!("page" in changes)) next.delete("page");

  const qs = next.toString();
  return qs ? `/s?${qs}` : "/s";
}

/** Toggles one value inside the pipe-delimited brand list. */
export function toggleBrand(current: RawParams, brand: string): string {
  const raw = one(current.brand);
  const set = new Set(raw ? raw.split("|").filter(Boolean) : []);
  if (set.has(brand)) set.delete(brand);
  else set.add(brand);

  return buildUrl(current, {
    brand: set.size > 0 ? [...set].join("|") : null,
  });
}
