import Link from "next/link";
import type { Metadata } from "next";
import { search, CATEGORIES } from "@/lib/catalog";
import { parseParams, buildUrl, type RawParams } from "@/lib/search-params";
import { Filters } from "@/components/search/Filters";
import { FilterPanel } from "@/components/search/FilterPanel";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { reviewCount } from "@/lib/format";

const PAGE_SIZE = 16;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}): Promise<Metadata> {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q : undefined;
  const cat = typeof raw.c === "string" ? raw.c : undefined;
  const catName = CATEGORIES.find((c) => c.slug === cat)?.name;

  return {
    title: q
      ? `Amazon.com: ${q}`
      : catName
        ? `Amazon.com: ${catName}`
        : "Amazon.com: All Departments",
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const raw = await searchParams;
  const params = parseParams(raw);
  const { results, facets, total } = search(params);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(params.page, pageCount);
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = results.slice(start, start + PAGE_SIZE);

  // Drives the count badge on the mobile "Filters" toggle.
  const activeFilterCount =
    (params.category && params.category !== "all" ? 1 : 0) +
    (params.brands?.length ?? 0) +
    (params.minPrice != null || params.maxPrice != null ? 1 : 0) +
    (params.minRating != null ? 1 : 0) +
    (params.primeOnly ? 1 : 0) +
    (params.dealsOnly ? 1 : 0);

  const categoryName =
    params.category && params.category !== "all"
      ? CATEGORIES.find((c) => c.slug === params.category)?.name
      : undefined;

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-3">
      <div className="flex flex-col gap-4 lg:flex-row">
        <FilterPanel activeCount={activeFilterCount}>
          <Filters
            raw={raw}
            facets={facets}
            active={{
              category: String(params.category ?? "all"),
              brands: params.brands ?? [],
              minPrice: params.minPrice,
              maxPrice: params.maxPrice,
              minRating: params.minRating,
              primeOnly: params.primeOnly,
              dealsOnly: params.dealsOnly,
            }}
          />
        </FilterPanel>

        <div className="min-w-0 flex-1">
          {/* ------------------------------------------- result header */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2.5">
            <h1 className="text-[14px] font-normal text-ink">
              {total === 0 ? (
                "No results"
              ) : (
                <>
                  <span className="font-bold">
                    {start + 1}-{Math.min(start + PAGE_SIZE, total)}
                  </span>{" "}
                  of {reviewCount(total)} results
                  {params.q && (
                    <>
                      {" "}
                      for{" "}
                      <span className="font-bold text-price">
                        &quot;{params.q}&quot;
                      </span>
                    </>
                  )}
                  {categoryName && !params.q && (
                    <>
                      {" "}
                      in <span className="font-bold">{categoryName}</span>
                    </>
                  )}
                </>
              )}
            </h1>

            <SortLinks raw={raw} current={params.sort ?? "featured"} />
          </div>

          {/* -------------------------------------------------- results */}
          {total === 0 ? (
            <NoResults query={params.q} />
          ) : (
            <div className="bg-white">
              {pageItems.map((p) => (
                <SearchResultCard key={p.asin} product={p} />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <Pagination raw={raw} page={page} pageCount={pageCount} />
          )}
        </div>
      </div>
    </div>
  );
}

const SORT_LABELS: Record<string, string> = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Avg. Customer Review",
  reviews: "Most Reviewed",
  newest: "Newest Arrivals",
};

/**
 * A <select> would need client JS to navigate on change; rendering the sort
 * options as links keeps the whole page a server component.
 */
function SortLinks({ raw, current }: { raw: RawParams; current: string }) {
  return (
    <div className="flex items-center gap-2 text-[14px]">
      <span className="text-ink">Sort by:</span>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {Object.entries(SORT_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={buildUrl(raw, { sort: key === "featured" ? null : key })}
            className={
              current === key
                ? "font-bold text-ink"
                : "link-teal"
            }
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Pagination({
  raw,
  page,
  pageCount,
}: {
  raw: RawParams;
  page: number;
  pageCount: number;
}) {
  // A sliding window keeps the control small when there are many pages.
  const from = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages = Array.from(
    { length: Math.min(5, pageCount) },
    (_, i) => from + i,
  ).filter((n) => n >= 1 && n <= pageCount);

  return (
    <nav
      aria-label="Search results pages"
      className="mt-3 flex items-center justify-center gap-2 bg-white py-4"
    >
      <PageLink
        raw={raw}
        to={page - 1}
        disabled={page === 1}
        label="Previous"
      />
      {pages.map((n) => (
        <Link
          key={n}
          href={buildUrl(raw, { page: n === 1 ? null : String(n) })}
          aria-current={n === page ? "page" : undefined}
          className={`min-w-[38px] rounded border px-3 py-1.5 text-center text-[14px] ${
            n === page
              ? "border-[#e77600] bg-[#fef8f2] font-bold text-ink"
              : "border-line bg-white text-ink hover:bg-[#f7fafa]"
          }`}
        >
          {n}
        </Link>
      ))}
      <PageLink
        raw={raw}
        to={page + 1}
        disabled={page === pageCount}
        label="Next"
      />
    </nav>
  );
}

function PageLink({
  raw,
  to,
  disabled,
  label,
}: {
  raw: RawParams;
  to: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="rounded border border-line bg-[#f7f8f8] px-3 py-1.5 text-[14px] text-[#a1a1a1]">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={buildUrl(raw, { page: to === 1 ? null : String(to) })}
      className="rounded border border-line bg-white px-3 py-1.5 text-[14px] text-ink hover:bg-[#f7fafa]"
    >
      {label}
    </Link>
  );
}

function NoResults({ query }: { query?: string }) {
  return (
    <div className="bg-white px-6 py-12 text-center">
      <h2 className="mb-2 text-[21px] font-bold text-ink">
        No results{query ? ` for "${query}"` : ""}
      </h2>
      <p className="mb-4 text-[14px] text-[#565959]">
        Try checking your spelling, using fewer words, or removing some
        filters.
      </p>
      <Link href="/s" className="text-[14px] link-teal">
        Browse all departments
      </Link>
    </div>
  );
}
