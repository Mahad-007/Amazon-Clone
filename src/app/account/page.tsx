import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "@/lib/supabase/server";
import { listOrders } from "@/lib/orders";
import { formatDay, money, orderNumber } from "@/lib/format";
import { Container } from "@/components/layout/Container";
import { stepIndex, STEPS } from "@/components/orders/progress";
import { buttonStyles } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = { title: "Your account" };
export const dynamic = "force-dynamic";

const TILES = [
  { href: "/orders", title: "Orders", body: "Track hauls and buy things again.", tone: "bg-lime", glyph: "01" },
  { href: "/wishlist", title: "Wish list", body: "Everything you saved for later.", tone: "bg-pink", glyph: "02" },
  { href: "/cart", title: "Cart", body: "What you're about to check out.", tone: "bg-sun", glyph: "03" },
  { href: "/api", title: "API docs", body: "Drive your account over REST.", tone: "bg-sky", glyph: "04" },
];

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/signin?next=/account");

  const orders = await listOrders();
  const name = (user.user_metadata?.name as string | undefined) ?? user.email?.split("@")[0] ?? "there";
  const spent = orders.reduce((n, o) => n + o.totalCents, 0);

  return (
    <Container className="py-8 md:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-muted">Your account</p>
          <h1 className="mt-1 font-display text-[40px] font-extrabold leading-none tracking-tight md:text-[56px]">
            Hi, {name.split(" ")[0]}.
          </h1>
          <p className="mt-3 text-muted">
            Signed in as <strong className="text-ink">{user.email}</strong>
          </p>
        </div>
        <dl className="grid grid-cols-2 border-[3px] border-ink bg-card font-mono shadow-brut">
          <div className="flex flex-col-reverse px-4 py-3">
            <dt className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">Orders</dt>
            <dd className="font-display text-[28px] font-extrabold leading-none">{orders.length}</dd>
          </div>
          <div className="flex flex-col-reverse border-l-[3px] border-ink px-4 py-3">
            <dt className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">Hauled</dt>
            <dd className="font-display text-[28px] font-extrabold leading-none">{money(spent)}</dd>
          </div>
        </dl>
      </div>

      <ul className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TILES.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className={`flex h-full min-h-[150px] flex-col border-[3px] border-ink p-4 shadow-brut press ${t.tone}`}
            >
              <span aria-hidden="true" className="font-mono text-[13px] font-bold">
                {t.glyph}
              </span>
              <span className="mt-auto font-display text-[22px] font-extrabold leading-tight">{t.title}</span>
              <span className="text-[14px]">{t.body}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section>
        <SectionHeading title="Recent orders" href="/orders" />
        {orders.length === 0 ? (
          <div className="brut bg-card px-6 py-8">
            <p className="font-display text-[22px] font-bold">Nothing hauled yet.</p>
            <p className="mt-1 text-muted">Your first order will show up here.</p>
          </div>
        ) : (
          <Panel as="div" bodyClassName="divide-y-[3px] divide-ink">
            {orders.slice(0, 4).map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center gap-4 p-4 hover:bg-sun">
                <span className="grid h-16 w-16 shrink-0 place-items-center border-2 border-ink bg-paper p-1.5">
                  <img
                    src={o.items[0]?.imageUrl}
                    alt=""
                    loading="lazy"
                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="clamp-1 font-semibold">
                    {o.items[0]?.title}
                    {o.items.length > 1 && ` + ${o.items.length - 1} more`}
                  </span>
                  <span className="block font-mono text-[12px] text-muted">
                    #{orderNumber(o.id)} · {formatDay(o.placedAt)} · {STEPS[stepIndex(o)]}
                  </span>
                </span>
                <span className="font-display text-[18px] font-extrabold">{money(o.totalCents)}</span>
              </Link>
            ))}
          </Panel>
        )}
      </section>

      <form action="/api/auth/signout" method="post" className="mt-10">
        <button type="submit" className={buttonStyles({ variant: "secondary" })}>
          Sign out
        </button>
      </form>
    </Container>
  );
}
