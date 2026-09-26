import Link from "next/link";
import { CATEGORIES } from "@/lib/types";
import { Wordmark } from "./Wordmark";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Shop",
    links: [
      ["/deals", "Deals"],
      ["/s?sort=reviews", "Best sellers"],
      ["/s?sort=rating", "Top rated"],
      ["/s?express=1", "HAUL Express"],
    ],
  },
  {
    title: "You",
    links: [
      ["/account", "Account"],
      ["/orders", "Orders"],
      ["/wishlist", "Wish list"],
      ["/cart", "Cart"],
    ],
  },
  {
    title: "Build",
    links: [
      ["/api", "REST API docs"],
      ["/api/v1", "API index (JSON)"],
      ["https://github.com/Mahad-007/haul", "Source on GitHub"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t-[3px] border-ink bg-lime">
      <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-4 py-12 md:grid-cols-[1.2fr_2fr] md:px-6">
        <div>
          <Wordmark size="lg" />
          <p className="mt-6 max-w-sm font-display text-[22px] font-bold leading-tight">
            A loud little store for stuff worth hauling home.
          </p>
          <a
            href="#top"
            className="mt-6 inline-flex h-10 items-center rounded-brut border-[3px] border-ink bg-card px-4 font-mono text-[12px] font-bold uppercase shadow-brut press"
          >
            ↑ Back to top
          </a>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-3 font-mono text-[12px] font-bold uppercase tracking-[0.16em]">{col.title}</h2>
              <ul className="space-y-1.5">
                {col.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-[14px] font-semibold hover:bg-ink hover:text-lime">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <nav aria-label="Departments">
            <h2 className="mb-3 font-mono text-[12px] font-bold uppercase tracking-[0.16em]">Departments</h2>
            <ul className="space-y-1.5">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link href={`/s?c=${c.slug}`} className="text-[14px] font-semibold hover:bg-ink hover:text-lime">
                    {c.short}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="border-t-[3px] border-ink bg-ink text-paper">
        <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 py-4 font-mono text-[11px] uppercase tracking-wider md:px-6">
          <p>Designed and built by Mahad Khalid · 8x take-home</p>
          <p className="text-paper/70">
            Demo store, no real payments. Product data and images come from public marketplace listings.
          </p>
        </div>
      </div>
    </footer>
  );
}
