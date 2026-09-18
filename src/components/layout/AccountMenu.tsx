"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type Props = { name: string | null };

/**
 * The "Hello, sign in / Account & Lists" flyout. Amazon opens this on hover
 * with a short close delay so the pointer can travel diagonally into the
 * panel without it vanishing; the timer below is what buys that grace.
 */
export function AccountMenu({ name }: Props) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function hide() {
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  }

  return (
    <div
      className="relative hidden sm:block"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <Link
        href={name ? "/account" : "/signin"}
        className="nav-box block px-2 py-1.5 leading-tight"
      >
        <span className="block text-[12px] text-white">
          Hello, {name ?? "sign in"}
        </span>
        <span className="flex items-center gap-1 text-[14px] font-bold text-white">
          Account &amp; Lists
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-[#ccc]" aria-hidden="true">
            <path fill="currentColor" d="M7 10l5 5 5-5z" />
          </svg>
        </span>
      </Link>

      {open && (
        <div className="absolute right-0 top-full z-50 w-[420px] pt-2">
          <div className="rounded-sm bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,.35)]">
            {!name && (
              <div className="mb-3 flex flex-col items-center border-b border-line pb-3">
                <Link
                  href="/signin"
                  className="w-[220px] rounded-full bg-cta py-1.5 text-center text-[13px] hover:bg-cta-hover"
                >
                  Sign in
                </Link>
                <p className="mt-2 text-[12px] text-ink">
                  New customer?{" "}
                  <Link href="/register" className="link-teal">
                    Start here.
                  </Link>
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="mb-1.5 text-[15px] font-bold text-ink">
                  Your Lists
                </h3>
                <ul className="space-y-1 text-[13px] text-ink">
                  <li>
                    <Link href="/wishlist" className="hover:underline hover:text-link-hover">
                      Create a Wish List
                    </Link>
                  </li>
                  <li>
                    <Link href="/wishlist" className="hover:underline hover:text-link-hover">
                      Wish from Any Website
                    </Link>
                  </li>
                  <li>
                    <Link href="/wishlist" className="hover:underline hover:text-link-hover">
                      Your Saved Items
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="border-l border-line pl-4">
                <h3 className="mb-1.5 text-[15px] font-bold text-ink">
                  Your Account
                </h3>
                <ul className="space-y-1 text-[13px] text-ink">
                  <li>
                    <Link href="/account" className="hover:underline hover:text-link-hover">
                      Your Account
                    </Link>
                  </li>
                  <li>
                    <Link href="/orders" className="hover:underline hover:text-link-hover">
                      Your Orders
                    </Link>
                  </li>
                  <li>
                    <Link href="/wishlist" className="hover:underline hover:text-link-hover">
                      Your Wish List
                    </Link>
                  </li>
                  <li>
                    <Link href="/account" className="hover:underline hover:text-link-hover">
                      Your Addresses
                    </Link>
                  </li>
                  {name && (
                    <li className="pt-1">
                      <form action="/api/auth/signout" method="post">
                        <button
                          type="submit"
                          className="text-left hover:underline hover:text-link-hover"
                        >
                          Sign Out
                        </button>
                      </form>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
