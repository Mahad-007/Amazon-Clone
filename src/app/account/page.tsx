import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "@/lib/supabase/server";
import { listOrders } from "@/lib/orders";
import { formatDay } from "@/lib/format";

export const metadata: Metadata = { title: "Your Account" };
export const dynamic = "force-dynamic";

const CARDS = [
  {
    href: "/orders",
    title: "Your Orders",
    body: "Track packages, review past purchases and buy things again.",
    icon: "M20 8h-3V4H3a2 2 0 0 0-2 2v11h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2v-5zM6 18.5A1.5 1.5 0 1 1 7.5 17 1.5 1.5 0 0 1 6 18.5m12 0A1.5 1.5 0 1 1 19.5 17 1.5 1.5 0 0 1 18 18.5M17 12V9.5h2.5l1.96 2.5z",
  },
  {
    href: "/wishlist",
    title: "Your Wish List",
    body: "Everything you have saved for later in one place.",
    icon: "M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5A5.5 5.5 0 0 1 7.5 3 6 6 0 0 1 12 5.09 6 6 0 0 1 16.5 3 5.5 5.5 0 0 1 22 8.5c0 3.78-3.4 6.86-8.55 11.54z",
  },
  {
    href: "/cart",
    title: "Your Cart",
    body: "Review what you're about to buy and head to checkout.",
    icon: "M7 18a2 2 0 1 0 2 2 2 2 0 0 0-2-2m10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2M7.2 14.6h9.3c.75 0 1.41-.41 1.75-1.03l3.24-5.88A.75.75 0 0 0 20.83 6.6H6.21l-.71-1.5H2v1.5h2.3l3.3 6.96-1.24 2.24A1.5 1.5 0 0 0 7.2 17.1h12v-1.5H7.6a.19.19 0 0 1-.17-.28z",
  },
  {
    href: "/deals",
    title: "Today's Deals",
    body: "Everything currently discounted across the store.",
    icon: "M21.41 11.58 12.41 2.58A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.42l9 9a2 2 0 0 0 2.82 0l7-7a2 2 0 0 0 0-2.84M6.5 8A1.5 1.5 0 1 1 8 6.5 1.5 1.5 0 0 1 6.5 8",
  },
];

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/signin?next=/account");

  const orders = await listOrders();
  const name =
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "there";

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-5">
      <h1 className="mb-1 text-[28px] text-ink">Your Account</h1>
      <p className="mb-5 text-[14px] text-[#565959]">
        Signed in as <span className="font-bold text-ink">{user.email}</span>
      </p>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex gap-4 rounded-lg border border-line bg-white p-5 hover:bg-[#f7fafa]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-10 w-10 shrink-0 text-[#565959]"
              aria-hidden="true"
            >
              <path fill="currentColor" d={c.icon} />
            </svg>
            <span>
              <span className="block text-[17px] font-bold text-ink">
                {c.title}
              </span>
              <span className="block text-[13px] text-[#565959]">{c.body}</span>
            </span>
          </Link>
        ))}
      </div>

      <section className="rounded-lg border border-line bg-white p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[18px] font-bold text-ink">Recent orders</h2>
          <Link href="/orders" className="text-[13px] link-teal">
            See all
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-[14px] text-[#565959]">
            Hi {name} — you haven&apos;t placed an order yet.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {orders.slice(0, 3).map((o) => (
              <li key={o.id} className="flex items-center gap-4 py-3">
                <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center">
                  <img
                    src={o.items[0]?.imageUrl}
                    alt=""
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="clamp-1 text-[14px] text-ink">
                    {o.items[0]?.title}
                    {o.items.length > 1 && ` + ${o.items.length - 1} more`}
                  </p>
                  <p className="text-[13px] text-[#565959]">
                    Ordered {formatDay(o.placedAt)}
                  </p>
                </div>
                <Link href={`/orders/${o.id}`} className="text-[13px] link-teal">
                  Details
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action="/api/auth/signout" method="post" className="mt-5">
        <button
          type="submit"
          className="rounded-full border border-line bg-white px-5 py-1.5 text-[14px] text-ink hover:bg-[#f7fafa]"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
