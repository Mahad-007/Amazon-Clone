import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { AccountMenu } from "./AccountMenu";
import { cartCount } from "@/lib/cart";
import { getUser } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/types";

/**
 * Server component: it reads the session and the cart count directly, so the
 * header is correct on first paint with no client-side fetch or flicker.
 */
export async function Header() {
  const [user, count] = await Promise.all([getUser(), cartCount()]);

  const name =
    (user?.user_metadata?.name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    null;

  return (
    <header className="sticky top-0 z-40">
      {/* ------------------------------------------------ primary bar */}
      {/*
        Below lg the search bar wraps to its own full-width row (order-last
        + w-full), which is what amazon.com does on a phone. Keeping it on
        one row at 390px is what pushed the header into horizontal scroll.
      */}
      <div className="flex flex-wrap items-center gap-1 bg-navy px-2 py-1.5 text-white">
        <Logo />

        <Link
          href="/account"
          className="nav-box hidden items-end px-2 py-1.5 leading-tight lg:flex"
        >
          <svg viewBox="0 0 24 24" className="mb-0.5 h-4 w-4" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7m0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5"
            />
          </svg>
          <span>
            <span className="block text-[12px] text-[#ccc]">Deliver to</span>
            <span className="block text-[14px] font-bold">United States</span>
          </span>
        </Link>

        <div className="order-last w-full pt-1.5 lg:order-none lg:w-auto lg:flex-1 lg:pt-0">
          <Suspense fallback={<div className="h-10 w-full rounded bg-white/90" />}>
            <SearchBar />
          </Suspense>
        </div>

        <Link href="/" className="nav-box hidden items-center gap-1 px-2 py-2.5 lg:flex">
          <span className="text-[14px] font-bold">EN</span>
        </Link>

        {/* The flyout needs hover, so phones get a plain link instead. */}
        <Link
          href={name ? "/account" : "/signin"}
          className="nav-box ml-auto px-2 py-1.5 text-[13px] font-bold leading-tight sm:hidden"
        >
          {name ? `Hi, ${name}` : "Sign in"}
        </Link>

        <AccountMenu name={name} />

        <Link href="/orders" className="nav-box hidden px-2 py-1.5 leading-tight md:block">
          <span className="block text-[12px] text-white">Returns</span>
          <span className="block text-[14px] font-bold text-white">&amp; Orders</span>
        </Link>

        <Link
          href="/cart"
          className="nav-box relative flex items-end gap-1 px-2 py-2"
          aria-label={`Shopping cart, ${count} item${count === 1 ? "" : "s"}`}
        >
          <span className="relative">
            <svg viewBox="0 0 24 24" className="h-[30px] w-[30px]" aria-hidden="true">
              <path
                fill="currentColor"
                d="M7 18a2 2 0 1 0 2 2 2 2 0 0 0-2-2m10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2M7.2 14.6h9.3c.75 0 1.41-.41 1.75-1.03l3.24-5.88A.75.75 0 0 0 20.83 6.6H6.21l-.71-1.5H2v1.5h2.3l3.3 6.96-1.24 2.24A1.5 1.5 0 0 0 7.2 17.1h12v-1.5H7.6a.19.19 0 0 1-.17-.28z"
              />
            </svg>
            <span className="absolute -top-1 left-[17px] min-w-[16px] text-center text-[15px] font-bold text-[#f08804]">
              {count}
            </span>
          </span>
          <span className="hidden text-[14px] font-bold sm:inline">Cart</span>
        </Link>
      </div>

      {/* --------------------------------------------------- sub nav */}
      <nav className="flex items-center gap-1 overflow-x-auto bg-navy-light px-2 py-1 text-[14px] text-white rail-scroll">
        <Link href="/s" className="nav-box flex shrink-0 items-center gap-1.5 px-2 py-1 font-bold">
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
          </svg>
          All
        </Link>

        <Link href="/deals" className="nav-box shrink-0 px-2 py-1">
          Today&apos;s Deals
        </Link>

        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/s?c=${c.slug}`}
            className="nav-box shrink-0 whitespace-nowrap px-2 py-1"
          >
            {c.short}
          </Link>
        ))}

        <Link href="/orders" className="nav-box shrink-0 whitespace-nowrap px-2 py-1">
          Your Orders
        </Link>
      </nav>
    </header>
  );
}
