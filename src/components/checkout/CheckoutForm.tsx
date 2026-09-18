"use client";

import Link from "next/link";
import { useActionState } from "react";
import { placeOrder } from "@/app/actions/orders";
import { quote } from "@/lib/pricing";
import { money, deliveryDate, formatDelivery } from "@/lib/format";

type Item = {
  asin: string;
  title: string;
  image: string;
  priceCents: number;
  qty: number;
  isPrime: boolean;
};

/**
 * Single-page checkout. Amazon splits address / payment / review across
 * three screens; collapsing them into one is a deliberate call — it is fewer
 * steps to abandon, and the order summary stays visible while you type.
 */
export function CheckoutForm({
  items,
  defaultName,
}: {
  items: Item[];
  defaultName: string;
}) {
  const [state, action, pending] = useActionState(placeOrder, { error: null });

  const subtotal = items.reduce((n, i) => n + i.priceCents * i.qty, 0);
  const { shipping, tax, total } = quote(subtotal);
  const count = items.reduce((n, i) => n + i.qty, 0);
  const arrives = deliveryDate(items.every((i) => i.isPrime) ? 2 : 5);

  return (
    <form action={action}>
      <div className="border-b border-line bg-white px-6 py-3">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <Link href="/" className="text-[24px] font-bold text-ink">
            Checkout{" "}
            <span className="text-[14px] font-normal text-[#565959]">
              ({count} item{count === 1 ? "" : "s"})
            </span>
          </Link>
          <Link href="/cart" className="text-[13px] link-teal">
            Back to cart
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-5">
        {state.error && (
          <div
            role="alert"
            className="mb-4 rounded border border-[#c40000] bg-[#fff5f5] p-3 text-[14px] text-[#c40000]"
          >
            {state.error}
          </div>
        )}

        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-5">
            {/* ------------------------------------------- 1. address */}
            <Section step={1} title="Shipping address">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="fullName" label="Full name" defaultValue={defaultName} required />
                <Input
                  name="phone"
                  label="Phone number (optional)"
                  type="tel"
                  required={false}
                  autoComplete="tel"
                />
                <div className="sm:col-span-2">
                  <Input name="line1" label="Address line 1" required autoComplete="address-line1" />
                </div>
                <div className="sm:col-span-2">
                  <Input name="line2" label="Address line 2 (optional)" required={false} autoComplete="address-line2" />
                </div>
                <Input name="city" label="City" required autoComplete="address-level2" />
                <Input name="state" label="State" autoComplete="address-level1" required={false} />
                <Input name="postalCode" label="ZIP code" required autoComplete="postal-code" />
              </div>
            </Section>

            {/* ------------------------------------------- 2. payment */}
            <Section step={2} title="Payment method">
              <div className="mb-3 rounded border border-[#f0c14b] bg-[#fffbf3] p-3 text-[13px] text-ink">
                This is a demo store. No payment is taken and no card details
                are stored — the field below accepts any number and only the
                last four digits are kept, to render the order page.
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  name="card"
                  label="Card number"
                  defaultValue="4242 4242 4242 4242"
                  required={false}
                  autoComplete="off"
                />
                <Input name="nameOnCard" label="Name on card" defaultValue={defaultName} required={false} />
              </div>
            </Section>

            {/* -------------------------------------------- 3. review */}
            <Section step={3} title="Review items and delivery">
              <p className="mb-3 text-[15px] font-bold text-success">
                Arriving {formatDelivery(arrives)}
              </p>
              <ul className="space-y-3">
                {items.map((i) => (
                  <li key={i.asin} className="flex gap-3">
                    <div className="flex h-[70px] w-[70px] shrink-0 items-center justify-center">
                      <img
                        src={i.image}
                        alt={i.title}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="clamp-2 text-[14px] text-ink">{i.title}</p>
                      <p className="text-[13px] text-[#565959]">Qty: {i.qty}</p>
                    </div>
                    <span className="shrink-0 text-[14px] font-bold text-price">
                      {money(i.priceCents * i.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* --------------------------------------------- order summary */}
          <aside className="w-full shrink-0 lg:w-[300px]">
            <div className="sticky top-[110px] rounded border border-line bg-white p-4">
              <button
                type="submit"
                disabled={pending}
                className="mb-3 w-full rounded-full bg-cta py-2 text-[14px] text-ink shadow-sm hover:bg-cta-hover disabled:opacity-60"
              >
                {pending ? "Placing order…" : "Place your order"}
              </button>

              <p className="mb-3 text-[12px] text-[#565959]">
                By placing your order you agree to this demo&apos;s conditions
                of use.
              </p>

              <h2 className="mb-2 border-t border-line pt-3 text-[18px] font-bold text-ink">
                Order Summary
              </h2>

              <dl className="space-y-1 text-[14px] text-ink">
                <Row label={`Items (${count})`} value={money(subtotal)} />
                <Row
                  label="Shipping & handling"
                  value={shipping === 0 ? "FREE" : money(shipping)}
                />
                <div className="border-t border-line pt-1">
                  <Row label="Total before tax" value={money(subtotal + shipping)} />
                </div>
                <Row label="Estimated tax" value={money(tax)} />
              </dl>

              <p className="mt-2 flex justify-between border-t border-line pt-2 text-[18px] font-bold text-price">
                <span>Order total</span>
                <span>{money(total)}</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </form>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 text-[18px] font-bold text-ink">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-light text-[13px] text-white">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Input({
  name,
  label,
  type = "text",
  required = true,
  defaultValue,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-bold text-ink">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-price">
            *
          </span>
        )}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        className="w-full rounded-[3px] border border-[#a6a6a6] px-2 py-1.5 text-[14px] shadow-[inset_0_1px_2px_rgba(0,0,0,.08)] focus:amz-focus"
      />
    </label>
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
