import raw from "@/data/products.json";
import { CATEGORIES, type CategorySlug, type Product } from "./types";

/**
 * The catalogue is a static JSON import, so it is bundled at build time and
 * every query below runs in-process. 268 products is small enough that a
 * linear scan beats any index we could build, and it means search works
 * with no database round trip.
 */
const PRODUCTS = raw as Product[];

const BY_ASIN = new Map(PRODUCTS.map((p) => [p.asin, p]));

export function allProducts(): Product[] {
  return PRODUCTS;
}

export function getProduct(asin: string): Product | undefined {
  return BY_ASIN.get(asin);
}

export function getProducts(asins: string[]): Product[] {
  return asins
    .map((a) => BY_ASIN.get(a))
    .filter((p): p is Product => Boolean(p));
}

export function categoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

// ------------------------------------------------------------------ search

/**
 * Scores a product against a query. Amazon weights a title-prefix match far
 * above a scattered token match, which is what keeps "sony headphones" from
 * surfacing a headphone stand that merely mentions Sony.
 */
function score(product: Product, tokens: string[]): number {
  if (tokens.length === 0) return 1;

  const title = product.title.toLowerCase();
  const brand = product.brand.toLowerCase();
  let total = 0;

  for (const token of tokens) {
    if (brand === token) total += 14;
    else if (brand.startsWith(token)) total += 9;

    const at = title.indexOf(token);
    if (at === 0) total += 10;
    else if (at > 0) {
      // Word-boundary hits are worth more than mid-word coincidences.
      total += /\s/.test(title[at - 1] ?? "") ? 6 : 2;
    } else if (product.category.includes(token)) {
      total += 3;
    } else {
      // A token matching nothing at all disqualifies the product: Amazon's
      // search is an AND, not an OR.
      return 0;
    }
  }

  // Gentle popularity tiebreak so equally-relevant items rank sensibly.
  return total + Math.log10(product.reviewCount + 10);
}

export type SortKey =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "newest"
  | "reviews";

export type SearchParams = {
  q?: string;
  category?: CategorySlug | "all";
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  primeOnly?: boolean;
  dealsOnly?: boolean;
  sort?: SortKey;
};

export type Facets = {
  brands: { value: string; count: number }[];
  categories: { slug: CategorySlug; name: string; count: number }[];
  priceBuckets: { label: string; min: number; max: number; count: number }[];
};

const PRICE_BUCKETS = [
  { label: "Under $25", min: 0, max: 2500 },
  { label: "$25 to $50", min: 2500, max: 5000 },
  { label: "$50 to $100", min: 5000, max: 10000 },
  { label: "$100 to $200", min: 10000, max: 20000 },
  { label: "$200 & above", min: 20000, max: Number.MAX_SAFE_INTEGER },
];

/**
 * Applies every filter EXCEPT the named one. Facet counts have to ignore
 * their own dimension, otherwise selecting a brand collapses the brand list
 * to that single brand and you can never pick a second one.
 */
function matches(
  p: Product,
  params: SearchParams,
  tokens: string[],
  except?: "brand" | "category" | "price",
): boolean {
  if (score(p, tokens) === 0) return false;

  if (
    except !== "category" &&
    params.category &&
    params.category !== "all" &&
    p.category !== params.category
  ) {
    return false;
  }

  if (
    except !== "brand" &&
    params.brands?.length &&
    !params.brands.includes(p.brand)
  ) {
    return false;
  }

  if (except !== "price") {
    if (params.minPrice != null && p.priceCents < params.minPrice) return false;
    if (params.maxPrice != null && p.priceCents > params.maxPrice) return false;
  }

  if (params.minRating != null && p.rating < params.minRating) return false;
  if (params.primeOnly && !p.isPrime) return false;
  if (params.dealsOnly && p.listPriceCents == null) return false;

  return true;
}

function tokenize(q?: string): string[] {
  return (q ?? "")
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((t) => t.length > 1);
}

export function search(params: SearchParams): {
  results: Product[];
  facets: Facets;
  total: number;
} {
  const tokens = tokenize(params.q);
  const results = PRODUCTS.filter((p) => matches(p, params, tokens));

  const sorted = sortProducts(results, params.sort ?? "featured", tokens);

  // Facet counts come from the set filtered by every OTHER dimension.
  const forBrands = PRODUCTS.filter((p) => matches(p, params, tokens, "brand"));
  const forCategories = PRODUCTS.filter((p) =>
    matches(p, params, tokens, "category"),
  );
  const forPrice = PRODUCTS.filter((p) => matches(p, params, tokens, "price"));

  const brandCounts = new Map<string, number>();
  for (const p of forBrands) {
    brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1);
  }

  const categoryCounts = new Map<CategorySlug, number>();
  for (const p of forCategories) {
    categoryCounts.set(p.category, (categoryCounts.get(p.category) ?? 0) + 1);
  }

  return {
    results: sorted,
    total: sorted.length,
    facets: {
      brands: [...brandCounts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
        .slice(0, 12),
      categories: CATEGORIES.filter((c) => categoryCounts.has(c.slug)).map(
        (c) => ({
          slug: c.slug,
          name: c.name,
          count: categoryCounts.get(c.slug) ?? 0,
        }),
      ),
      priceBuckets: PRICE_BUCKETS.map((b) => ({
        ...b,
        count: forPrice.filter(
          (p) => p.priceCents >= b.min && p.priceCents < b.max,
        ).length,
      })).filter((b) => b.count > 0),
    },
  };
}

function sortProducts(
  list: Product[],
  sort: SortKey,
  tokens: string[],
): Product[] {
  const copy = [...list];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.priceCents - b.priceCents);
    case "price-desc":
      return copy.sort((a, b) => b.priceCents - a.priceCents);
    case "rating":
      return copy.sort(
        (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
      );
    case "reviews":
      return copy.sort((a, b) => b.reviewCount - a.reviewCount);
    case "newest":
      // No real publish date in the data; ASIN ordering is a stable stand-in.
      return copy.sort((a, b) => b.asin.localeCompare(a.asin));
    default:
      return copy.sort(
        (a, b) => score(b, tokens) - score(a, tokens) || b.reviewCount - a.reviewCount,
      );
  }
}

// ----------------------------------------------------------------- shelves

export function byCategory(slug: CategorySlug, limit = 20): Product[] {
  return PRODUCTS.filter((p) => p.category === slug).slice(0, limit);
}

export function bestSellers(limit = 20): Product[] {
  return [...PRODUCTS]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

export function topRated(limit = 20): Product[] {
  return [...PRODUCTS]
    .filter((p) => p.reviewCount > 500)
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

/**
 * Anything with a struck-through list price is a "deal".
 *
 * Sorting purely by discount is the obvious implementation and the wrong
 * one: a handful of categories carry listings with wildly inflated list
 * prices, so the whole first screen came back as budget earbuds. Instead we
 * rank within each department and then round-robin across them, so the grid
 * opens on the best deal in electronics, then books, then tools, and so on.
 */
export function deals(limit = 40): Product[] {
  const discount = (p: Product) =>
    1 - p.priceCents / (p.listPriceCents ?? p.priceCents);

  const byCategory = new Map<CategorySlug, Product[]>();
  for (const p of PRODUCTS) {
    if (p.listPriceCents == null) continue;
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  // Best deal first within each department...
  for (const list of byCategory.values()) {
    list.sort((a, b) => discount(b) - discount(a));
  }

  // ...then departments ordered by how good their best deal is, so the grid
  // still opens strong rather than alphabetically.
  const lanes = [...byCategory.values()].sort(
    (a, b) => discount(b[0]) - discount(a[0]),
  );

  const out: Product[] = [];
  for (let round = 0; out.length < limit; round++) {
    let addedThisRound = false;
    for (const lane of lanes) {
      if (round >= lane.length) continue;
      out.push(lane[round]);
      addedThisRound = true;
      if (out.length >= limit) break;
    }
    if (!addedThisRound) break; // every lane exhausted
  }

  return out;
}

/** Same department, excluding the product itself, most-reviewed first. */
export function related(product: Product, limit = 12): Product[] {
  return PRODUCTS.filter(
    (p) => p.category === product.category && p.asin !== product.asin,
  )
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

/** Cheaper items in the same department — Amazon's "compare with similar". */
export function alsoViewed(product: Product, limit = 6): Product[] {
  return PRODUCTS.filter(
    (p) => p.category === product.category && p.asin !== product.asin,
  )
    .sort(
      (a, b) =>
        Math.abs(a.priceCents - product.priceCents) -
        Math.abs(b.priceCents - product.priceCents),
    )
    .slice(0, limit);
}

// -------------------------------------------------------------- suggestions

/** Search-box autocomplete: brand names and title prefixes that match. */
export function suggestions(q: string, limit = 8): string[] {
  const query = q.trim().toLowerCase();
  if (query.length < 1) return [];

  const out = new Set<string>();

  for (const p of PRODUCTS) {
    if (out.size >= limit * 3) break;
    const brand = p.brand.toLowerCase();
    if (brand.startsWith(query)) out.add(p.brand.toLowerCase());
  }

  for (const p of PRODUCTS) {
    const title = p.shortTitle.toLowerCase();
    if (title.includes(query)) {
      // Trim to a search-phrase-length fragment rather than a whole title.
      const words = title.split(/\s+/).slice(0, 5).join(" ");
      out.add(words);
    }
    if (out.size >= limit * 3) break;
  }

  return [...out].slice(0, limit);
}

export { CATEGORIES };
