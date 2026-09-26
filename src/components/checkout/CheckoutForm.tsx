"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { placeOrder } from "@/app/actions/orders";
import { quote } from "@/lib/pricing";
import { deliveryDate, formatDelivery, money } from "@/lib/format";
import { TINT } from "@/lib/tint";
import type { CategorySlug } from "@/lib/types";
import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/Button";
import { Field, FormError } from "@/components/ui/Field";
import { Sticker } from "@/components/ui/Sticker";
import { Receipt } from "./Receipt";

export type CheckoutItem = {
  asin: string;
  title: string;
  image: string;
  category: CategorySlug;
  priceCents: number;
  qty: number;
  express: boolean;
};

/**
 * One-page checkout in three numbered steps, with the receipt pinned beside
 * them so the total never scrolls out of view. The totals shown here are a
 * preview: the order itself is priced by place_order() in Postgres.
 */
export function CheckoutForm({ items, defaultName }: { items: CheckoutItem[]; defaultName: string }) {
  const [state, action, pending] = useActionState(placeOrder, { error: null });
  const v = state.values ?? {};

  const subtotal = items.reduce((n, i) => n + i.priceCents * i.qty, 0);
  const { shipping, tax, total } = quote(subtotal);
  const count = items.reduce((n, i) => n + i.qty, 0);
  const allExpress = items.every((i) => i.express);
  const arrives = deliveryDate(allExpress ? 2 : 5);

  return (
    <form action={action}>
      <Container className="pt-8 md:pt-12">
        <nav aria-label="Checkout progress" className="mb-5">
          <ol className="flex flex-wrap items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-wider">
            <li>
              <Link href="/cart" className="link">
                Cart
              </Link>
            </li>
            <li aria-hidden="true">→</li>
            <li aria-current="step" className="bg-ink px-1.5 text-lime">
              Checkout
            </li>
            <li aria-hidden="true">→</li>
            <li className="text-muted">Done</li>
          </ol>
        </nav>

        <div className="mb-8 flex flex-wrap items-end gap-x-4 gap-y-2">
          <h1 className="font-display text-[48px] font-extrabold leading-none tracking-[-0.03em] md:text-[72px]">
            Checkout
          </h1>
          <Sticker tone="lime" tilt={-4} className="mb-2">
            {count} item{count === 1 ? "" : "s"}
          </Sticker>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-6">
            <Step n="01" title="Ship to" tone="bg-sun">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="fullName" label="Full name" defaultValue={v.fullName ?? defaultName} required autoComplete="name" />
                <Field
                  name="phone"
                  label="Phone"
                  hint="Optional, for delivery updates."
                  type="tel"
                  autoComplete="tel"
                  defaultValue={v.phone}
                />
                <Field
                  name="line1"
                  label="Street address"
                  defaultValue={v.line1}
                  required
                  autoComplete="address-line1"
                  className="sm:col-span-2"
                />
                <Field
                  name="line2"
                  label="Apartment, suite, etc."
                  hint="Optional."
                  defaultValue={v.line2}
                  autoComplete="address-line2"
                  className="sm:col-span-2"
                />
                <Field name="city" label="City" defaultValue={v.city} required autoComplete="address-level2" />
                <div className="grid grid-cols-2 gap-4">
                  <Field name="state" label="State" defaultValue={v.state} autoComplete="address-level1" />
                  <Field
                    name="postalCode"
                    label="ZIP code"
                    defaultValue={v.postalCode}
                    required
                    autoComplete="postal-code"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </Step>

            <Step n="02" title="Pay" tone="bg-sky">
              <p className="mb-4 border-2 border-ink bg-pink-soft px-3 py-2 text-[14px]">
                <strong>Demo store: no payment is taken.</strong> Any card number works, and only its last four digits
                are stored, to show on the order.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  name="card"
                  label="Card number"
                  defaultValue="4242 4242 4242 4242"
                  autoComplete="off"
                  inputMode="numeric"
                />
                <Field
                  name="nameOnCard"
                  label="Name on card"
                  defaultValue={v.nameOnCard ?? defaultName}
                  autoComplete="cc-name"
                />
              </div>
            </Step>

            <Step n="03" title="Review items" tone="bg-lime">
              <p className="mb-4 flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                <Sticker tone={allExpress ? "lime" : "card"} tilt={-2}>
                  {allExpress ? "Express" : "Standard"}
                </Sticker>
                Arriving {formatDelivery(arrives)}
              </p>
              <ul className="divide-y-2 divide-dashed divide-ink/30">
                {items.map((i) => (
                  <li key={i.asin} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <span className={`flex h-16 w-16 shrink-0 items-center justify-center border-2 border-ink p-1.5 ${TINT[i.category]}`}>
                      <img src={i.image} alt="" loading="lazy" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="clamp-2 text-[14px] font-semibold leading-snug">{i.title}</p>
                      <p className="font-mono text-[12px] text-muted">
                        {i.qty} × {money(i.priceCents)}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[14px] font-bold">{money(i.priceCents * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/cart" className="link mt-4 inline-block text-[14px] font-semibold">
                Change items in your cart
              </Link>
            </Step>
          </div>

          <aside className="lg:sticky lg:top-[172px]">
            <Receipt
              title="Your order"
              meta={`${count} item${count === 1 ? "" : "s"}`}
              rows={[
                { label: `Items (${count})`, value: money(subtotal) },
                { label: "Shipping", value: shipping === 0 ? "FREE" : money(shipping) },
                { label: "Before tax", value: money(subtotal + shipping), muted: true },
                { label: "Est. tax (7.25%)", value: money(tax), muted: true },
              ]}
              totalLabel="Order total"
              totalValue={money(total)}
              footnote="Prices confirmed by the server at checkout: the order is priced from the catalogue in one database transaction."
            >
              {state.error && <FormError>{state.error}</FormError>}
              <button type="submit" disabled={pending} className={buttonStyles({ size: "lg", block: true })}>
                {pending ? "Placing order…" : "Place your order"}
              </button>
            </Receipt>
          </aside>
        </div>
      </Container>
    </form>
  );
}

const Step = ({ n, title, tone, children }: { n: string; title: string; tone: string; children: ReactNode }) => (
  <section className="border-[3px] border-ink bg-card shadow-brut">
    <div className={`flex items-center gap-3 border-b-[3px] border-ink px-5 py-3 ${tone}`}>
      <span aria-hidden="true" className="font-display text-[32px] font-extrabold leading-none">
        {n}
      </span>
      <h2 className="font-display text-[22px] font-bold tracking-tight">
        <span className="sr-only">Step {Number(n)}: </span>
        {title}
      </h2>
    </div>
    <div className="p-5">{children}</div>
  </section>
);
