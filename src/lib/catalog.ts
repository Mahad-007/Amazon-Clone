import "server-only";
import { unstable_cache } from "next/cache";
import { publicDb } from "./supabase/public";
import type { Database } from "./supabase/database.types";
import { CATEGORIES, type Category, type CategorySlug, type Product, type Variant } from "./types";

/**
 * The catalogue lives in Postgres (supabase/migrations/0002_catalog.sql).
 * Search scoring, facets and the shelf algorithms are SQL functions, so the
 * pages and the /api/v1 REST API run exactly the same queries.
 *
 * Reads go through a cookie-less anon client and the Next data cache, tagged
 * `catalog`. Writes that change what a product shows (a new review moves its
 * rating) invalidate that tag. The commit SHA is part of every key because
 * the data cache outlives deploys.
 */
export const CATALOG_TAG = "catalog";
const BUILD = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";

function cached<F extends (...args: any[]) => Promise<unknown>>(name: string, fn: F): F {
  return unstable_cache(fn, ["catalog", name, BUILD], {
    tags: [CATALOG_TAG],
    revalidate: 3600,
  }) as unknown as F;
}

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export function toProduct(row: ProductRow): Product {
  return {
    asin: row.asin,
    title: row.title,
    shortTitle: row.short_title,
    brand: row.brand,
    priceCents: row.price_cents,
    listPriceCents: row.list_price_cents,
    // Generated columns are typed nullable by the codegen; they never are.
    rating: Number(row.rating ?? row.scraped_rating),
    reviewCount: row.review_count ?? row.scraped_review_count,
    haulReviewCount: row.user_review_count,
    image: row.image,
    images: row.images,
    category: row.category as CategorySlug,
    express: row.express,
    badge: row.badge,
    boughtPastMonth: row.bought_past_month,
    bullets: row.bullets,
    stock: row.stock,
    variants: row.variants as Variant[],
  };
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`catalog: ${what} failed: ${result.error.message}`);
  return result.data as T;
}

// ------------------------------------------------------------------ lookups

export const getProduct = cached("product", async (asin: string): Promise<Product | null> => {
  const row = unwrap(
    await publicDb().from("products").select("*").eq("asin", asin).maybeSingle(),
    "getProduct",
  );
  return row ? toProduct(row) : null;
});

/** Looks up several products, keeping the input order and dropping unknowns. */
export const getProducts = cached("products", async (asins: string[]): Promise<Product[]> => {
  if (asins.length === 0) return [];
  const rows = unwrap(
    await publicDb().from("products").select("*").in("asin", asins),
    "getProducts",
  );
  const byAsin = new Map(rows.map((r) => [r.asin, toProduct(r)]));
  return asins.map((a) => byAsin.get(a)).filter((p): p is Product => Boolean(p));
});

export const listCategories = cached(
  "categories",
  async (): Promise<(Category & { count: number })[]> => {
    const rows = unwrap(
      await publicDb()
        .from("categories")
        .select("slug, name, short, products(count)")
        .order("sort_order"),
      "listCategories",
    );
    return rows.map((r) => ({
      slug: r.slug as CategorySlug,
      name: r.name,
      short: r.short,
      count: (r.products as unknown as { count: number }[])[0]?.count ?? 0,
    }));
  },
);

// ------------------------------------------------------------------- search

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest" | "reviews";

export type SearchParams = {
  q?: string;
  category?: CategorySlug | "all";
  brands?: string[];
  /** Cents. */
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  expressOnly?: boolean;
  dealsOnly?: boolean;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
};

export type Facets = {
  brands: { value: string; count: number }[];
  categories: { slug: CategorySlug; name: string; count: number }[];
  priceBuckets: { label: string; min: number; max: number; count: number }[];
};

export type SearchPage = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

/** Maps the app's params onto the SQL functions' named arguments. */
function filterArgs(p: SearchParams) {
  const int = (n: number | undefined) =>
    n == null || !Number.isFinite(n) ? undefined : Math.trunc(n);
  return {
    q: p.q?.trim() || undefined,
    cat: p.category && p.category !== "all" ? p.category : undefined,
    brands: p.brands?.length ? p.brands : undefined,
    min_price: int(p.minPrice),
    max_price: int(p.maxPrice),
    min_rating: p.minRating ?? undefined,
    express_only: Boolean(p.expressOnly),
    deals_only: Boolean(p.dealsOnly),
  };
}

export const searchProducts = cached("search", async (p: SearchParams): Promise<SearchPage> => {
  const data = unwrap(
    await publicDb().rpc("search_products", {
      ...filterArgs(p),
      sort: p.sort ?? "featured",
      page: p.page ?? 1,
      page_size: p.pageSize ?? 16,
    }),
    "search_products",
  ) as unknown as Omit<SearchPage, "items"> & { items: ProductRow[] };
  return { ...data, items: data.items.map(toProduct) };
});

export const searchFacets = cached("facets", async (p: SearchParams): Promise<Facets> => {
  return unwrap(
    await publicDb().rpc("search_facets", filterArgs(p)),
    "search_facets",
  ) as unknown as Facets;
});

export async function search(p: SearchParams): Promise<SearchPage & { facets: Facets }> {
  const [page, facets] = await Promise.all([searchProducts(p), searchFacets(p)]);
  return { ...page, facets };
}

// ------------------------------------------------------------------ shelves

export const byCategory = cached(
  "byCategory",
  async (slug: CategorySlug, limit = 20): Promise<Product[]> => {
    const rows = unwrap(
      await publicDb()
        .from("products")
        .select("*")
        .eq("category", slug)
        .order("review_count", { ascending: false })
        .order("asin")
        .limit(limit),
      "byCategory",
    );
    return rows.map(toProduct);
  },
);

export const bestSellers = cached("bestSellers", async (limit = 20): Promise<Product[]> => {
  const rows = unwrap(
    await publicDb()
      .from("products")
      .select("*")
      .order("review_count", { ascending: false })
      .order("asin")
      .limit(limit),
    "bestSellers",
  );
  return rows.map(toProduct);
});

/** Highest rated among products with enough reviews for the rating to mean something. */
export const topRated = cached("topRated", async (limit = 20): Promise<Product[]> => {
  const rows = unwrap(
    await publicDb()
      .from("products")
      .select("*")
      .gt("review_count", 500)
      .order("rating", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(limit),
    "topRated",
  );
  return rows.map(toProduct);
});

/**
 * Popular products under a price ceiling (cents), interleaved across
 * departments. Ranked purely by popularity the shelf is all paperbacks.
 */
export const under = cached("under", async (maxCents: number, limit = 12): Promise<Product[]> => {
  const rows = unwrap(
    await publicDb()
      .from("products")
      .select("*")
      .lt("price_cents", maxCents)
      .order("review_count", { ascending: false })
      .limit(200),
    "under",
  );
  return roundRobin(rows.map(toProduct), limit);
});

/** Takes the best of each department in turn, preserving order within each. */
function roundRobin(products: Product[], limit: number): Product[] {
  const lanes = new Map<CategorySlug, Product[]>();
  for (const p of products) lanes.set(p.category, [...(lanes.get(p.category) ?? []), p]);
  const out: Product[] = [];
  for (let round = 0; out.length < limit; round++) {
    const picks = [...lanes.values()].map((lane) => lane[round]).filter(Boolean);
    if (picks.length === 0) break;
    out.push(...picks.slice(0, limit - out.length));
  }
  return out;
}

/** Discounted products, round-robin across departments (see SQL `deals`). */
export const deals = cached("deals", async (limit = 40): Promise<Product[]> => {
  const rows = unwrap(await publicDb().rpc("deals", { lim: limit }), "deals");
  return rows.map(toProduct);
});

/** Same department, excluding the product itself, most-reviewed first. */
export const related = cached(
  "related",
  async (asin: string, category: CategorySlug, limit = 12): Promise<Product[]> => {
    const rows = unwrap(
      await publicDb()
        .from("products")
        .select("*")
        .eq("category", category)
        .neq("asin", asin)
        .order("review_count", { ascending: false })
        .limit(limit),
      "related",
    );
    return rows.map(toProduct);
  },
);

/** Same department, nearest in price. */
export const alsoViewed = cached("alsoViewed", async (asin: string, limit = 6): Promise<Product[]> => {
  const rows = unwrap(await publicDb().rpc("also_viewed", { target: asin, lim: limit }), "also_viewed");
  return rows.map(toProduct);
});

/**
 * Recommendations for a cart, order or list: the seeds' departments,
 * round-robin, topped up with best sellers (see SQL `related_to_any`).
 */
export const relatedToAny = cached(
  "relatedToAny",
  async (seedAsins: string[], limit = 14): Promise<Product[]> => {
    const rows = unwrap(
      await publicDb().rpc("related_to_any", { seeds: seedAsins, lim: limit }),
      "related_to_any",
    );
    return rows.map(toProduct);
  },
);

export const suggestions = cached("suggestions", async (q: string, limit = 8): Promise<string[]> => {
  if (!q.trim()) return [];
  return unwrap(await publicDb().rpc("suggestions", { q, lim: limit }), "suggestions") ?? [];
});

export { CATEGORIES };
