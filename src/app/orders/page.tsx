import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { listOrders } from "@/lib/orders";
import { getUser } from "@/lib/supabase/server";
import { formatDay, money, orderNumber } from "@/lib/format";
import { relatedToAny } from "@/lib/catalog";
import { Container } from "@/components/layout/Container";
import { Shelf } from "@/components/product/Shelf";
import { BuyAgainButton } from "@/components/orders/BuyAgainButton";
import { STEPS, stepIndex } from "@/components/orders/progress";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sticker } from "@/components/ui/Sticker";

export const metadata: Metadata = { title: "Your orders" };
export const dynamic = "force-dynamic";

const STATUS_TONE = ["sun", "card", "cobalt", "lime"] as const;

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/signin?next=/orders");

  const orders = await listOrders();
  const recommended = await relatedToAny(
    orders.flatMap((o) => o.items.map((i) => i.asin)),
    14,
  );

  return (
    <Container className="py-8 md:py-12">
      <SectionHeading as="h1" title="Your orders">
        <span className="font-mono text-[13px] font-bold text-muted">
          {orders.length} {orders.length === 1 ? "haul" : "hauls"}
        </span>
      </SectionHeading>

      {orders.length === 0 ? (
        <div className="brut bg-card px-6 py-12 text-center">
          <p className="font-display text-[32px] font-extrabold leading-tight">No hauls yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-muted">Once you place an order it shows up here, with tracking.</p>
          <ButtonLink href="/" className="mt-6">
            Start shopping
          </ButtonLink>
        </div>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => {
            const step = stepIndex(order);
            return (
              <li key={order.id} className="brut bg-card">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b-[3px] border-ink bg-paper-deep px-4 py-3 md:px-5">
                  <dl className="flex flex-wrap gap-x-8 gap-y-2">
                    {[
                      ["Placed", formatDay(order.placedAt)],
                      ["Total", money(order.totalCents)],
                      ["Ship to", order.shipTo.fullName],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col-reverse">
                        <dd className="font-semibold">{value}</dd>
                        <dt className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">{label}</dt>
                      </div>
                    ))}
                  </dl>
                  <div className="flex flex-col items-start gap-1 sm:items-end">
                    <span className="font-mono text-[12px] font-bold">#{orderNumber(order.id)}</span>
                    <Link href={`/orders/${order.id}`} className="link text-[14px] font-semibold">
                      View order details
                    </Link>
                  </div>
                </div>

                <div className="p-4 md:p-5">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Sticker tone={STATUS_TONE[step]} tilt={-2}>
                      {STEPS[step]}
                    </Sticker>
                    <p className="font-display text-[20px] font-bold">
                      {step === 3 ? "Delivered" : "Arriving"} {formatDay(order.arrivesOn)}
                    </p>
                  </div>

                  <ul className="grid gap-4 md:grid-cols-2">
                    {order.items.map((item) => (
                      <li key={item.asin} className="flex gap-4">
                        <Link
                          href={`/product/${item.asin}`}
                          className="grid h-24 w-24 shrink-0 place-items-center border-2 border-ink bg-paper p-2"
                        >
                          <img
                            src={item.imageUrl}
                            alt=""
                            loading="lazy"
                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link href={`/product/${item.asin}`} className="clamp-2 font-semibold hover:underline">
                            {item.title}
                          </Link>
                          <p className="mt-1 font-mono text-[12px] text-muted">
                            Qty {item.qty} · {money(item.priceCents)} each
                          </p>
                          <div className="mt-2">
                            <BuyAgainButton asin={item.asin} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {recommended.length > 0 && (
        <section className="mt-14">
          <SectionHeading title={orders.length ? "Related to your past hauls" : "Popular right now"} />
          <Shelf products={recommended} label="Recommended products" />
        </section>
      )}
    </Container>
  );
}
