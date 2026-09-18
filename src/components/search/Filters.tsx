import Link from "next/link";
import type { Facets } from "@/lib/catalog";
import { Stars } from "@/components/ui/Stars";
import { buildUrl, toggleBrand, type RawParams } from "@/lib/search-params";
import { CATEGORIES } from "@/lib/types";

/**
 * Every control is a link that rewrites the query string. No client state,
 * no JavaScript required — the filter rail works with JS disabled and each
 * filtered view is a shareable URL.
 */
export function Filters({
  raw,
  facets,
  active,
}: {
  raw: RawParams;
  facets: Facets;
  active: {
    category: string;
    brands: string[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    primeOnly?: boolean;
    dealsOnly?: boolean;
  };
}) {
  return (
    <>
      <Section title="Department">
        <ul className="space-y-1.5">
          <li>
            <Link
              href={buildUrl(raw, { c: null })}
              className={`text-[14px] ${
                active.category === "all"
                  ? "font-bold text-ink"
                  : "text-ink hover:text-link-hover hover:underline"
              }`}
            >
              All Departments
            </Link>
          </li>
          {facets.categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={buildUrl(raw, { c: c.slug })}
                className={`text-[14px] ${
                  active.category === c.slug
                    ? "font-bold text-ink"
                    : "text-ink hover:text-link-hover hover:underline"
                }`}
              >
                {CATEGORIES.find((x) => x.slug === c.slug)?.short ?? c.name}{" "}
                <span className="text-[#565959]">({c.count})</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Customer Reviews">
        <ul className="space-y-1.5">
          {[4, 3, 2, 1].map((r) => (
            <li key={r}>
              <Link
                href={buildUrl(raw, {
                  rating: active.minRating === r ? null : String(r),
                })}
                className="flex items-center gap-1.5"
              >
                <Stars rating={r} size={15} />
                <span
                  className={`text-[14px] ${
                    active.minRating === r
                      ? "font-bold text-ink"
                      : "text-ink hover:text-link-hover hover:underline"
                  }`}
                >
                  &amp; Up
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Price">
        <ul className="space-y-1.5">
          {facets.priceBuckets.map((b) => {
            const selected =
              active.minPrice === b.min &&
              (active.maxPrice === b.max ||
                (b.max === Number.MAX_SAFE_INTEGER && active.maxPrice == null));

            return (
              <li key={b.label}>
                <Link
                  href={
                    selected
                      ? buildUrl(raw, { min: null, max: null })
                      : buildUrl(raw, {
                          min: String(b.min),
                          max:
                            b.max === Number.MAX_SAFE_INTEGER
                              ? null
                              : String(b.max),
                        })
                  }
                  className={`text-[14px] ${
                    selected
                      ? "font-bold text-ink"
                      : "text-ink hover:text-link-hover hover:underline"
                  }`}
                >
                  {b.label}{" "}
                  <span className="text-[#565959]">({b.count})</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      {facets.brands.length > 0 && (
        <Section title="Brand">
          <ul className="space-y-1.5">
            {facets.brands.map((b) => {
              const on = active.brands.includes(b.value);
              return (
                <li key={b.value}>
                  <Link
                    href={toggleBrand(raw, b.value)}
                    className="flex items-center gap-2 text-[14px] text-ink hover:text-link-hover"
                  >
                    <Checkbox checked={on} />
                    <span className={on ? "font-bold" : ""}>
                      {b.value}{" "}
                      <span className="font-normal text-[#565959]">
                        ({b.count})
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Section title="Deals &amp; Delivery">
        <ul className="space-y-1.5">
          <li>
            <Link
              href={buildUrl(raw, { prime: active.primeOnly ? null : "1" })}
              className="flex items-center gap-2 text-[14px] text-ink hover:text-link-hover"
            >
              <Checkbox checked={Boolean(active.primeOnly)} />
              <span className={active.primeOnly ? "font-bold" : ""}>
                Prime eligible
              </span>
            </Link>
          </li>
          <li>
            <Link
              href={buildUrl(raw, { deals: active.dealsOnly ? null : "1" })}
              className="flex items-center gap-2 text-[14px] text-ink hover:text-link-hover"
            >
              <Checkbox checked={Boolean(active.dealsOnly)} />
              <span className={active.dealsOnly ? "font-bold" : ""}>
                Today&apos;s Deals
              </span>
            </Link>
          </li>
        </ul>
      </Section>

      <Link
        href={raw.q ? `/s?q=${encodeURIComponent(String(raw.q))}` : "/s"}
        className="text-[13px] link-teal"
      >
        Clear all filters
      </Link>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <h3 className="mb-1.5 text-[16px] font-bold text-ink">{title}</h3>
      {children}
    </section>
  );
}

/** Styled to match Amazon's filter checkbox without needing an input. */
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[2px] border ${
        checked ? "border-[#007185] bg-[#007185]" : "border-[#888c8c] bg-white"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" aria-hidden="true">
          <path
            fill="currentColor"
            d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
          />
        </svg>
      )}
    </span>
  );
}
