import Link from "next/link";
import type { Metadata } from "next";
import { search, CATEGORIES } from "@/lib/catalog";
import { parseParams, buildUrl, toggleBrand, type RawParams } from "@/lib/search-params";
import { money, reviewCount } from "@/lib/format";
import { Filters } from "@/components/search/Filters";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { Chip } from "@/components/ui/Chip";
import { ButtonLink } from "@/components/ui/Button";

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
  return { title: q ? `Search: ${q}` : (catName ?? "Everything") };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const raw = await searchParams;
  const params = parseParams(raw);
  const { items, facets, total, page, pageCount } = await search({ ...params, pageSize: PAGE_SIZE });
  const start = (page - 1) * PAGE_SIZE;

  const category = params.category && params.category !== "all" ? CATEGORIES.find((c) => c.slug === params.category) : undefined;
  const chips = activeChips(raw, params, facets.priceBuckets);
  const sort = params.sort ?? "featured";

  const filters = (
    <Filters
      raw={raw}
      facets={facets}
      active={{
        category: String(params.category ?? "all"),
        brands: params.brands ?? [],
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        minRating: params.minRating,
        expressOnly: params.expressOnly,
        dealsOnly: params.dealsOnly,
      }}
    />
  );

  return (
    <Container className="pt-8">
      {/* --------------------------------------------------------- title */}
      <header className="mb-6">
        <p className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-muted">
          {params.q ? "Search results" : "Browse"}
        </p>
        <h1 className="mt-1 break-words font-display text-[40px] font-extrabold leading-[0.95] tracking-tight md:text-[56px]">
          {params.q ? (
            <>
              “<span className="bg-lime px-1">{params.q}</span>”
            </>
          ) : (
            (category?.name ?? "Everything")
          )}
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* ---------------------------------------------------- filters */}
        {/* Phones: a native <details> drawer, which needs no JavaScript. */}
        <details className="group lg:hidden">
          <summary className="flex h-12 cursor-pointer list-none items-center justify-between rounded-brut border-[3px] border-ink bg-card px-4 font-display text-[16px] font-bold shadow-brut [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              Filters
              {chips.length > 0 && (
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 font-mono text-[12px] text-lime">
                  {chips.length}
                </span>
              )}
            </span>
            <span aria-hidden="true" className="font-mono transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="mt-4">{filters}</div>
        </details>
        <aside aria-label="Filters" className="hidden lg:block">
          {filters}
        </aside>

        <div className="min-w-0">
          {/* ------------------------------------------ count + chips + sort */}
          <div className="mb-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="mr-2 font-mono text-[13px] font-bold uppercase" aria-live="polite">
                {total === 0 ? (
                  "0 results"
                ) : (
                  <>
                    {start + 1}–{Math.min(start + PAGE_SIZE, total)} of {reviewCount(total)} results
                  </>
                )}
              </p>
              {chips.map((c) => (
                <Chip key={c.label} href={c.href} tone="lime" removable>
                  <span className="sr-only">Remove filter: </span>
                  {c.label}
                </Chip>
              ))}
              {chips.length > 1 && (
                <Link href={params.q ? `/s?q=${encodeURIComponent(params.q)}` : "/s"} className="link ml-1 text-[13px] font-semibold">
                  Clear all
                </Link>
              )}
            </div>

            <nav aria-label="Sort results" className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <ul className="inline-flex border-[3px] border-ink bg-card shadow-brut-sm">
                {Object.entries(SORT_LABELS).map(([key, label], i) => (
                  <li key={key} className={i > 0 ? "border-l-[3px] border-ink" : ""}>
                    <Link
                      href={buildUrl(raw, { sort: key === "featured" ? null : key })}
                      aria-current={sort === key ? "true" : undefined}
                      className={`block whitespace-nowrap px-3 py-2 text-[13px] font-semibold ${
                        sort === key ? "bg-ink text-lime" : "hover:bg-sun"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* ---------------------------------------------------- results */}
          {total === 0 ? (
            <NoResults query={params.q} filtered={chips.length > 0} />
          ) : (
            <ul className="grid grid-cols-2 gap-4 md:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
              {items.map((p, i) => (
                <li key={p.asin} className="min-w-0">
                  <ProductCard product={p} showAddToCart priority={i < 3} />
                </li>
              ))}
            </ul>
          )}

          {pageCount > 1 && <Pagination raw={raw} page={page} pageCount={pageCount} />}
        </div>
      </div>
    </Container>
  );
}

const SORT_LABELS: Record<string, string> = {
  featured: "Best match",
  reviews: "Most reviewed",
  rating: "Top rated",
  "price-asc": "Price ↑",
  "price-desc": "Price ↓",
  newest: "Newest",
};

type ActiveChip = { label: string; href: string };

/** Every active filter as a removable chip: the chip links to the URL without it. */
function activeChips(
  raw: RawParams,
  params: ReturnType<typeof parseParams>,
  buckets: { label: string; min: number; max: number }[],
): ActiveChip[] {
  const out: ActiveChip[] = [];
  if (params.q && params.category && params.category !== "all") {
    const name = CATEGORIES.find((c) => c.slug === params.category)?.short ?? params.category;
    out.push({ label: name, href: buildUrl(raw, { c: null }) });
  }
  for (const b of params.brands ?? []) out.push({ label: b, href: toggleBrand(raw, b) });
  if (params.minPrice != null || params.maxPrice != null) {
    const bucket = buckets.find(
      (b) => b.min === params.minPrice && (b.max === params.maxPrice || (params.maxPrice == null && b.max === Number.MAX_SAFE_INTEGER)),
    );
    const label =
      bucket?.label ??
      (params.maxPrice != null
        ? `${money(params.minPrice ?? 0)} – ${money(params.maxPrice)}`
        : `${money(params.minPrice ?? 0)} & up`);
    out.push({ label, href: buildUrl(raw, { min: null, max: null }) });
  }
  if (params.minRating != null) out.push({ label: `${params.minRating}★ & up`, href: buildUrl(raw, { rating: null }) });
  if (params.expressOnly) out.push({ label: "Express", href: buildUrl(raw, { express: null, prime: null }) });
  if (params.dealsOnly) out.push({ label: "On sale", href: buildUrl(raw, { deals: null }) });
  return out;
}

function Pagination({ raw, page, pageCount }: { raw: RawParams; page: number; pageCount: number }) {
  // A sliding window keeps the control short when there are many pages.
  const from = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, i) => from + i);
  const href = (n: number) => buildUrl(raw, { page: n === 1 ? null : String(n) });
  const block = "grid h-12 min-w-12 place-items-center border-[3px] border-ink px-3 font-display text-[18px] font-extrabold";

  return (
    <nav aria-label="Search results pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${block} bg-card shadow-brut-sm press`}>
          <span aria-hidden="true">←</span>
          <span className="sr-only">Previous page</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={`${block} bg-paper-deep text-ink/30`}>
          ←
        </span>
      )}
      {pages.map((n) => (
        <Link
          key={n}
          href={href(n)}
          aria-current={n === page ? "page" : undefined}
          className={`${block} ${n === page ? "bg-ink text-lime" : "bg-card shadow-brut-sm press"}`}
        >
          {n}
        </Link>
      ))}
      {page < pageCount ? (
        <Link href={href(page + 1)} className={`${block} bg-card shadow-brut-sm press`}>
          <span aria-hidden="true">→</span>
          <span className="sr-only">Next page</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={`${block} bg-paper-deep text-ink/30`}>
          →
        </span>
      )}
    </nav>
  );
}

function NoResults({ query, filtered }: { query?: string; filtered: boolean }) {
  return (
    <div className="brut relative overflow-hidden bg-sun px-6 py-14 text-center">
      <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-10" />
      <div className="relative">
        <p className="font-display text-[64px] font-extrabold leading-none">¯\_(ツ)_/¯</p>
        <h2 className="mt-6 font-display text-[28px] font-extrabold">
          Nothing matched{query ? ` “${query}”` : ""}.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[16px]">
          {filtered ? "Try removing a filter or two." : "Try fewer words, or a brand name like Sony, LEGO or Ninja."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/s">Browse everything</ButtonLink>
          <ButtonLink href="/deals" variant="pink">
            See the deals
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
