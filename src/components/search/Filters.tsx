import Link from "next/link";
import type { ReactNode } from "react";
import type { Facets } from "@/lib/catalog";
import { Stars } from "@/components/ui/Stars";
import { buildUrl, toggleBrand, type RawParams } from "@/lib/search-params";
import { CATEGORIES } from "@/lib/types";

export type ActiveFilters = {
  category: string;
  brands: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  expressOnly?: boolean;
  dealsOnly?: boolean;
};

/**
 * Every control is a link that rewrites the query string. No client state and
 * no JavaScript: the filters work with JS disabled and every filtered view is
 * a shareable URL.
 */
export function Filters({ raw, facets, active }: { raw: RawParams; facets: Facets; active: ActiveFilters }) {
  return (
    <div className="space-y-5">
      <Group title="Department">
        <ul className="space-y-0.5">
          <li>
            <Option href={buildUrl(raw, { c: null })} on={active.category === "all"}>
              Everything
            </Option>
          </li>
          {facets.categories.map((c) => (
            <li key={c.slug}>
              <Option href={buildUrl(raw, { c: c.slug })} on={active.category === c.slug} count={c.count}>
                {CATEGORIES.find((x) => x.slug === c.slug)?.short ?? c.name}
              </Option>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Shipping & deals">
        <ul className="space-y-0.5">
          <li>
            <Option href={buildUrl(raw, { express: active.expressOnly ? null : "1", prime: null })} on={Boolean(active.expressOnly)} box>
              HAUL Express
            </Option>
          </li>
          <li>
            <Option href={buildUrl(raw, { deals: active.dealsOnly ? null : "1" })} on={Boolean(active.dealsOnly)} box>
              On sale
            </Option>
          </li>
        </ul>
      </Group>

      <Group title="Rating">
        <ul className="space-y-0.5">
          {[4, 3, 2].map((r) => (
            <li key={r}>
              <Option href={buildUrl(raw, { rating: active.minRating === r ? null : String(r) })} on={active.minRating === r}>
                <span className="flex items-center gap-2">
                  <Stars rating={r} size={14} />
                  <span>&amp; up</span>
                </span>
              </Option>
            </li>
          ))}
        </ul>
      </Group>

      {facets.priceBuckets.length > 0 && (
      <Group title="Price">
        <ul className="space-y-0.5">
          {facets.priceBuckets.map((b) => {
            const top = b.max === Number.MAX_SAFE_INTEGER;
            const on = active.minPrice === b.min && (active.maxPrice === b.max || (top && active.maxPrice == null));
            return (
              <li key={b.label}>
                <Option
                  href={
                    on
                      ? buildUrl(raw, { min: null, max: null })
                      : buildUrl(raw, { min: String(b.min), max: top ? null : String(b.max) })
                  }
                  on={on}
                  count={b.count}
                >
                  {b.label}
                </Option>
              </li>
            );
          })}
        </ul>
      </Group>
      )}

      {facets.brands.length > 0 && (
        <Group title="Brand">
          <ul className="space-y-0.5">
            {facets.brands.map((b) => (
              <li key={b.value}>
                <Option href={toggleBrand(raw, b.value)} on={active.brands.includes(b.value)} count={b.count} box>
                  {b.value}
                </Option>
              </li>
            ))}
          </ul>
        </Group>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-[3px] border-ink bg-card shadow-brut-sm">
      <h2 className="border-b-[3px] border-ink bg-ink px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-paper">
        {title}
      </h2>
      <div className="p-2">{children}</div>
    </section>
  );
}

/** One filter row. `box` renders a checkbox-style square for multi-selects. */
function Option({
  href,
  on,
  count,
  box = false,
  children,
}: {
  href: string;
  on: boolean;
  count?: number;
  box?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={on ? "true" : undefined}
      className={`flex items-center gap-2 rounded-[4px] px-2 py-1.5 text-[14px] ${
        on ? "bg-lime font-bold" : "hover:bg-sun"
      }`}
    >
      {box && (
        <span
          aria-hidden="true"
          className={`grid h-4 w-4 shrink-0 place-items-center border-2 border-ink ${on ? "bg-ink text-lime" : "bg-card"}`}
        >
          {on && (
            <svg viewBox="0 0 24 24" className="h-3 w-3">
              <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
            </svg>
          )}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count != null && <span className="font-mono text-[11px] text-muted">{count}</span>}
    </Link>
  );
}
