import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getOrder } from "@/lib/orders";
import { getUser } from "@/lib/supabase/server";
import { formatDay, money, orderNumber } from "@/lib/format";
import { BuyAgainButton } from "@/components/orders/BuyAgainButton";

export const metadata: Metadata = { title: "Order Details" };
export const dynamic = "force-dynamic";

const STEPS = ["Ordered", "Shipped", "Out for delivery", "Delivered"] as const;

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/signin?next=/orders");

  const { id } = await params;
  const { placed } = await searchParams;

  const order = await getOrder(id);
  if (!order) notFound();

  // A freshly placed order is always at step 1.
  const stepIndex = order.status === "delivered" ? 3 : 0;

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-5">
      {placed === "1" && (
        <div className="mb-4 rounded-lg border border-[#067d62] bg-[#f0fbf7] px-5 py-4">
          <h1 className="mb-1 text-[24px] text-success">
            Order placed, thank you!
          </h1>
          <p className="text-[14px] text-ink">
            A confirmation would normally be emailed to you. This is a demo
            store, so no email is sent and no payment was taken.
          </p>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[21px] text-ink">Order details</h2>
        <Link href="/orders" className="text-[13px] link-teal">
          Back to your orders
        </Link>
      </div>

      <div className="mb-4 rounded-lg border border-line bg-white px-5 py-4">
        <p className="mb-1 text-[13px] text-[#565959]">
          Ordered {formatDay(order.placedAt)} · Order #{" "}
          {orderNumber(order.id)}
        </p>
        <p className="text-[18px] font-bold text-ink">
          Arriving {formatDay(order.arrivesOn)}
        </p>

        {/* ------------------------------------------ delivery progress */}
        <ol className="mt-4 flex gap-1" aria-label="Delivery progress">
          {STEPS.map((step, i) => (
            <li key={step} className="flex-1">
              <span
                className={`block h-1.5 rounded-full ${
                  i <= stepIndex ? "bg-success" : "bg-[#e3e6e6]"
                }`}
              />
              <span
                className={`mt-1.5 block text-[12px] ${
                  i <= stepIndex ? "font-bold text-ink" : "text-[#565959]"
                }`}
              >
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <section className="rounded-lg border border-line bg-white px-5 py-4">
          <h3 className="mb-3 text-[16px] font-bold text-ink">Items</h3>
          <ul className="space-y-4">
            {order.items.map((item) => (
              <li key={item.asin} className="flex gap-4">
                <Link
                  href={`/product/${item.asin}`}
                  className="flex h-[90px] w-[90px] shrink-0 items-center justify-center"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${item.asin}`}>
                    <p className="clamp-2 text-[14px] link-teal">
                      {item.title}
                    </p>
                  </Link>
                  <p className="mt-0.5 text-[13px] text-[#565959]">
                    Qty: {item.qty}
                  </p>
                  <p className="text-[14px] font-bold text-price">
                    {money(item.priceCents * item.qty)}
                  </p>
                  <div className="mt-2 max-w-[180px]">
                    <BuyAgainButton asin={item.asin} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-line bg-white px-5 py-4">
            <h3 className="mb-2 text-[16px] font-bold text-ink">
              Shipping address
            </h3>
            <address className="text-[14px] not-italic leading-5 text-ink">
              {order.shipTo.fullName}
              <br />
              {order.shipTo.line1}
              {order.shipTo.line2 && (
                <>
                  <br />
                  {order.shipTo.line2}
                </>
              )}
              <br />
              {order.shipTo.city}
              {order.shipTo.state ? `, ${order.shipTo.state}` : ""}{" "}
              {order.shipTo.postalCode}
              <br />
              {order.shipTo.country}
            </address>
          </section>

          <section className="rounded-lg border border-line bg-white px-5 py-4">
            <h3 className="mb-2 text-[16px] font-bold text-ink">
              Payment method
            </h3>
            <p className="text-[14px] text-ink">
              Card ending in {order.paymentLast4}
            </p>
          </section>

          <section className="rounded-lg border border-line bg-white px-5 py-4">
            <h3 className="mb-2 text-[16px] font-bold text-ink">
              Order summary
            </h3>
            <dl className="space-y-1 text-[14px] text-ink">
              <Row label="Item(s) subtotal" value={money(order.subtotalCents)} />
              <Row
                label="Shipping"
                value={
                  order.shippingCents === 0 ? "FREE" : money(order.shippingCents)
                }
              />
              <Row label="Estimated tax" value={money(order.taxCents)} />
            </dl>
            <p className="mt-2 flex justify-between border-t border-line pt-2 text-[16px] font-bold text-price">
              <span>Grand total</span>
              <span>{money(order.totalCents)}</span>
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
