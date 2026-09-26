import Link from "next/link";

/**
 * Account entry point. Signed out it is a plain "Sign in" link. Signed in it
 * is a native <details> dropdown, which opens on click or keyboard, works
 * before hydration and needs no client JavaScript at all.
 */
export function AccountMenu({ name }: { name: string | null }) {
  if (!name) {
    return (
      <Link
        href="/signin"
        className="flex h-11 items-center rounded-brut border-[3px] border-ink bg-card px-3 font-display text-[15px] font-bold shadow-brut press"
      >
        Sign in
      </Link>
    );
  }

  return (
    <details className="group relative">
      <summary className="flex h-11 cursor-pointer list-none items-center gap-1.5 rounded-brut border-[3px] border-ink bg-card px-3 font-display text-[15px] font-bold shadow-brut press [&::-webkit-details-marker]:hidden">
        <span className="max-w-[9ch] truncate sm:max-w-[14ch]">Hi, {name}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true">
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </summary>

      <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-56 border-[3px] border-ink bg-card shadow-brut">
        <ul className="divide-y-2 divide-ink">
          {[
            ["/account", "Your account"],
            ["/orders", "Orders"],
            ["/wishlist", "Wish list"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="block px-4 py-2.5 text-[14px] font-semibold hover:bg-lime">
                {label}
              </Link>
            </li>
          ))}
          <li>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="w-full px-4 py-2.5 text-left text-[14px] font-semibold hover:bg-pink">
                Sign out
              </button>
            </form>
          </li>
        </ul>
      </div>
    </details>
  );
}
