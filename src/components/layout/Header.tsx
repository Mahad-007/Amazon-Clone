import Link from "next/link";
import { Suspense } from "react";
import { cartCount } from "@/lib/cart";
import { getUser } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/types";
import { AccountMenu } from "./AccountMenu";
import { SearchBar } from "./SearchBar";
import { Wordmark } from "./Wordmark";

/**
 * Server component: it reads the session and the cart count directly, so the
 * header is right on first paint with no client fetch or flicker.
 */
export async function Header() {
  const [user, count] = await Promise.all([getUser(), cartCount()]);
  const name =
    (user?.user_metadata?.name as string | undefined)?.split(" ")[0] ?? user?.email?.split("@")[0] ?? null;

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper">
      {/* ------------------------------------------------------ ticker strip */}
      <p className="hidden bg-ink py-1 text-center font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-lime sm:block">
        Free shipping over $35 · Express in 2 days · 30-day returns
      </p>

      {/* ------------------------------------------------------- main bar */}
      <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3 md:gap-x-5 md:px-6">
        <Wordmark />

        <div className="order-last w-full md:order-none md:w-auto md:flex-1">
          <Suspense fallback={<div className="h-12 w-full rounded-brut border-[3px] border-ink bg-card" />}>
            <SearchBar />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <AccountMenu name={name} />

          <Link
            href="/cart"
            aria-label={`Shopping cart, ${count} item${count === 1 ? "" : "s"}`}
            className="flex h-11 items-center gap-2 rounded-brut border-[3px] border-ink bg-lime pl-2 pr-3 font-display text-[15px] font-bold shadow-brut press"
          >
            {/* The count comes first in the DOM: tests and screen readers read it. */}
            <span className="order-2 grid h-7 min-w-7 place-items-center rounded-full border-2 border-ink bg-ink px-1.5 font-mono text-[13px] leading-none text-lime">
              {count}
            </span>
            <svg viewBox="0 0 24 24" className="order-0 h-5 w-5" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinejoin="round"
                d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8zM9 8V6a3 3 0 0 1 6 0v2"
              />
            </svg>
            <span className="order-1 hidden sm:inline">Cart</span>
          </Link>
        </div>
      </div>

      {/* --------------------------------------------------- departments */}
      <nav aria-label="Departments" className="border-t-[3px] border-ink bg-paper-deep">
        <ul className="no-scrollbar mx-auto flex w-full max-w-[1320px] items-center gap-2 overflow-x-auto px-4 py-2 md:px-6">
          <li>
            <Link
              href="/deals"
              className="inline-flex h-8 items-center whitespace-nowrap rounded-full border-2 border-ink bg-pink px-3 text-[13px] font-bold hover:bg-ink hover:text-pink"
            >
              Deals
            </Link>
          </li>
          <li>
            <Link
              href="/s"
              className="inline-flex h-8 items-center whitespace-nowrap rounded-full border-2 border-ink bg-card px-3 text-[13px] font-semibold hover:bg-ink hover:text-paper"
            >
              Everything
            </Link>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/s?c=${c.slug}`}
                className="inline-flex h-8 items-center whitespace-nowrap rounded-full border-2 border-ink bg-card px-3 text-[13px] font-semibold hover:bg-ink hover:text-paper"
              >
                {c.short}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
