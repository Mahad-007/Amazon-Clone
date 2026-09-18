import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { listOrders } from "@/lib/orders";
import { getUser } from "@/lib/supabase/server";
import { formatDay, money, orderNumber } from "@/lib/format";
import { getProducts, relatedToAny } from "@/lib/catalog";
import { Rail } from "@/components/home/Rail";
import { BuyAgainButton } from "@/components/orders/BuyAgainButton";

export const metadata: Metadata = { title: "Your Orders" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/signin?next=/orders");

  const orders = await listOrders();

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5">
      <h1 className="mb-4 text-[28px] text-ink">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white px-6 py-10 text-center">
          <h2 className="mb-2 text-[21px] font-bold text-ink">
            You have no orders yet
          </h2>
          <p className="mb-4 text-[14px] text-[#565959]">
            Once you place an order it will show up here.
          </p>
          <Link
            href="/"
            className="inline-block rounded-full bg-cta px-5 py-1.5 text-[14px] text-ink hover:bg-cta-hover"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {orders.map((order) => (
            <li
              key={order.id}
              className="overflow-hidden rounded-lg border border-line bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-[#f0f2f2] px-5 py-3 text-[12px] uppercase text-[#565959]">
                <div className="flex flex-wrap gap-8">
                  <div>
                    <div>Order placed</div>
                    <div className="text-[14px] normal-case text-ink">
                      {formatDay(order.placedAt)}
                    </div>
                  </div>
                  <div>
                    <div>Total</div>
                    <div className="text-[14px] normal-case text-ink">
                      {money(order.totalCents)}
                    </div>
                  </div>
                  <div>
                    <div>Ship to</div>
                    <div className="text-[14px] normal-case text-ink">
                      {order.shipTo.fullName}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div>Order # {orderNumber(order.id)}</div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="text-[13px] normal-case link-teal"
                  >
                    View order details
                  </Link>
                </div>
              </div>

              <div className="px-5 py-4">
                <p className="mb-3 text-[18px] font-bold text-ink">
                  {order.status === "delivered"
                    ? `Delivered ${formatDay(order.arrivesOn)}`
                    : `Arriving ${formatDay(order.arrivesOn)}`}
                </p>

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
                          Qty: {item.qty} · {money(item.priceCents)} each
                        </p>
                        <div className="mt-2 max-w-[200px]">
                          <BuyAgainButton asin={item.asin} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <Rail
          title="Related to items you've ordered"
          products={relatedToAny(
            getProducts(orders.flatMap((o) => o.items.map((i) => i.asin))),
            14,
          )}
        />
      </div>
    </div>
  );
}
