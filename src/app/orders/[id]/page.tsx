import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getOrder } from "@/lib/orders";
import { getUser } from "@/lib/supabase/server";
import { formatDay, money, orderNumber } from "@/lib/format";
import { Container } from "@/components/layout/Container";
import { BuyAgainButton } from "@/components/orders/BuyAgainButton";
import { STEPS, stepIndex } from "@/components/orders/progress";
import { ButtonLink } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Sticker } from "@/components/ui/Sticker";

export const metadata: Metadata = { title: "Order details" };
export const dynamic = "force-dynamic";

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

  const step = stepIndex(order);
  const itemCount = order.items.reduce((n, i) => n + i.qty, 0);
  const justPlaced = placed === "1";

  return (
    <Container className="py-8 md:py-12">
      {justPlaced && (
        <section className="brut relative mb-8 overflow-hidden bg-lime p-6 md:p-10">
          <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-[0.12]" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <Sticker tone="ink" tilt={-3}>
                #{orderNumber(order.id)}
              </Sticker>
              <h1 className="mt-4 font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.03em] md:text-[72px]">
                Order placed.
                <br />
                Nice haul.
              </h1>
              <p className="mt-4 max-w-lg text-[16px]">
                {itemCount} {itemCount === 1 ? "item is" : "items are"} on the way, arriving{" "}
                <strong>{formatDay(order.arrivesOn)}</strong>. This is a demo store, so no payment was taken and no email
                is sent.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/" variant="ink">
                Keep shopping
              </ButtonLink>
              <ButtonLink href="/orders" variant="secondary">
                All orders
              </ButtonLink>
            </div>
          </div>
        </section>
      )}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          {justPlaced ? (
            <h2 className="font-display text-[30px] font-extrabold leading-none md:text-[36px]">Order details</h2>
          ) : (
            <h1 className="font-display text-[30px] font-extrabold leading-none md:text-[36px]">Order details</h1>
          )}
          <p className="mt-2 font-mono text-[13px] text-muted">
            Placed {formatDay(order.placedAt)} · #{orderNumber(order.id)}
          </p>
        </div>
        <Link href="/orders" className="link font-mono text-[13px] font-bold uppercase">
          ← Back to orders
        </Link>
      </div>

      {/* ------------------------------------------------ delivery track */}
      <section aria-label="Delivery progress" className="brut mb-8 bg-card p-5 md:p-6">
        <p className="mb-5 font-display text-[22px] font-bold">
          {step === 3 ? "Delivered" : "Arriving"} {formatDay(order.arrivesOn)}
        </p>
        <ol className="grid grid-cols-4">
          {STEPS.map((label, i) => {
            const done = i <= step;
            return (
              <li key={label} className="relative" aria-current={i === step ? "step" : undefined}>
                {/* The rail: each step draws the segment to its left. */}
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className={`absolute right-1/2 top-[14px] h-[6px] w-full border-y-2 border-ink ${done ? "bg-lime" : "bg-paper-deep"}`}
                  />
                )}
                <span
                  aria-hidden="true"
                  className={`relative z-10 mx-auto grid h-8 w-8 place-items-center rounded-full border-[3px] border-ink font-mono text-[12px] font-bold ${
                    done ? "bg-lime" : "bg-card"
                  } ${i === step ? "shadow-brut-sm" : ""}`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={`mt-2 block text-center font-mono text-[11px] uppercase tracking-wider md:text-[12px] ${
                    done ? "font-bold" : "text-muted"
                  }`}
                >
                  {label}
                  <span className="sr-only">{done ? " (done)" : " (upcoming)"}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <Panel title={`Items (${itemCount})`} bodyClassName="divide-y-2 divide-ink/15">
          {order.items.map((item) => (
            <div key={item.asin} className="flex gap-4 p-4">
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
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="font-display text-[18px] font-extrabold">{money(item.priceCents * item.qty)}</span>
                  <BuyAgainButton asin={item.asin} />
                </div>
              </div>
            </div>
          ))}
        </Panel>

        <aside className="space-y-6">
          <Panel title="Ship to">
            <address className="not-italic leading-6">
              <strong>{order.shipTo.fullName}</strong>
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
              {order.shipTo.state ? `, ${order.shipTo.state}` : ""} {order.shipTo.postalCode}
              <br />
              {order.shipTo.country}
            </address>
          </Panel>

          <Panel title="Payment">
            <p className="font-mono text-[14px]">Card ending •••• {order.paymentLast4}</p>
          </Panel>

          {/* The receipt: mono type, dashed rules, like the slip in the box. */}
          <section aria-label="Order summary" className="brut bg-card p-5 font-mono text-[14px]">
            <p className="text-center text-[12px] font-bold uppercase tracking-[0.2em]">HAUL · Receipt</p>
            <p className="mt-1 text-center text-[11px] text-muted">#{orderNumber(order.id)}</p>
            <dl className="mt-4 space-y-1.5 border-t-2 border-dashed border-ink pt-3">
              <Row label="Items subtotal" value={money(order.subtotalCents)} />
              <Row label="Shipping" value={order.shippingCents === 0 ? "FREE" : money(order.shippingCents)} />
              <Row label="Tax (7.25%)" value={money(order.taxCents)} />
            </dl>
            <p className="mt-3 flex items-baseline justify-between border-t-2 border-dashed border-ink pt-3 text-[16px] font-bold">
              <span>Grand total</span>
              <span className="font-display text-[26px] font-extrabold">{money(order.totalCents)}</span>
            </p>
          </section>
        </aside>
      </div>
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
