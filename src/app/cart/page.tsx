import Link from "next/link";
import type { Metadata } from "next";
import { readCart } from "@/lib/cart";
import { bestSellers, getProducts, relatedToAny } from "@/lib/catalog";
import { money } from "@/lib/format";
import { quote } from "@/lib/pricing";
import { TINT } from "@/lib/tint";
import type { CartLine, Product } from "@/lib/types";
import { Container } from "@/components/layout/Container";
import { Shelf } from "@/components/product/Shelf";
import { ButtonLink } from "@/components/ui/Button";
import { ExpressBadge } from "@/components/ui/ExpressBadge";
import { Price } from "@/components/ui/Price";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sticker } from "@/components/ui/Sticker";
import { QtySelect } from "@/components/cart/QtySelect";
import { CartLineActions } from "@/components/cart/CartLineActions";
import { FreeShippingMeter } from "@/components/cart/FreeShippingMeter";
import { Receipt } from "@/components/checkout/Receipt";

export const metadata: Metadata = { title: "Your haul" };

// The cart is per-request state, so this page can never be prerendered.
export const dynamic = "force-dynamic";

type Line = { line: CartLine; product: Product };

const plural = (n: number) => `${n} item${n === 1 ? "" : "s"}`;

export default async function CartPage() {
  const lines = await readCart();
  const products = new Map((await getProducts(lines.map((l) => l.asin))).map((p) => [p.asin, p]));
  const withProduct = lines
    .map((line) => ({ line, product: products.get(line.asin) }))
    .filter((x): x is Line => Boolean(x.product));

  const active = withProduct.filter((x) => !x.line.saved);
  const saved = withProduct.filter((x) => x.line.saved);

  if (active.length === 0 && saved.length === 0) return <EmptyCart />;

  const itemCount = active.reduce((n, x) => n + x.line.qty, 0);
  const subtotal = active.reduce((n, x) => n + x.product.priceCents * x.line.qty, 0);
  const { shipping, tax, total } = quote(subtotal);
  const recommendations = await relatedToAny(
    withProduct.map((x) => x.line.asin),
    14,
  );

  return (
    <Container className="pt-8 md:pt-12">
      <div className="mb-8 flex flex-wrap items-end gap-x-4 gap-y-2">
        <h1 className="font-display text-[48px] font-extrabold leading-none tracking-[-0.03em] md:text-[72px]">
          Your haul
        </h1>
        <Sticker tone="lime" tilt={-4} className="mb-2">
          {plural(itemCount)}
        </Sticker>
      </div>

      {/* One grid, three children: on phones the receipt sits right after the
          items (before "Saved for later"); on desktop it is a sticky sidebar. */}
      <div className="grid items-start gap-x-8 gap-y-12 lg:grid-cols-[1fr_380px]">
          <section aria-labelledby="in-cart" className="min-w-0 lg:col-start-1">
            <h2 id="in-cart" className="sr-only">
              Items in your cart
            </h2>
            {active.length === 0 ? (
              <p className="border-[3px] border-dashed border-ink bg-card p-6 text-[15px]">
                Nothing in the cart right now. Your saved items are below: move one back when you&apos;re ready.
              </p>
            ) : (
              <>
                <ul className="space-y-5">
                  {active.map((x) => (
                    <CartItem key={x.line.asin} {...x} />
                  ))}
                </ul>
                <p className="mt-5 text-right font-display text-[20px] font-bold">
                  Subtotal ({plural(itemCount)}): <span className="bg-lime px-1.5">{money(subtotal)}</span>
                </p>
              </>
            )}
          </section>

        {active.length > 0 && (
          <aside className="lg:sticky lg:top-[172px] lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <Receipt
              title="Receipt"
              meta={plural(itemCount)}
              rows={[
                { label: `Subtotal (${plural(itemCount)})`, value: money(subtotal) },
                { label: "Shipping", value: shipping === 0 ? "FREE" : money(shipping) },
                { label: "Est. tax (7.25%)", value: money(tax), muted: true },
              ]}
              totalLabel="Estimated total"
              totalValue={money(total)}
              footnote="Final prices are confirmed by the server when you place the order."
            >
              <FreeShippingMeter subtotal={subtotal} />
              <ButtonLink href="/checkout" size="lg" block>
                Proceed to checkout →
              </ButtonLink>
            </Receipt>
          </aside>
        )}

          {saved.length > 0 && (
            <section aria-labelledby="saved-heading" className="min-w-0 lg:col-start-1">
              <div className="mb-4 flex items-center gap-3">
                <h2 id="saved-heading" className="font-display text-[28px] font-extrabold tracking-tight">
                  Saved for later
                </h2>
                <span className="grid h-8 min-w-8 place-items-center rounded-full border-2 border-ink bg-sun px-2 font-mono text-[13px] font-bold">
                  {saved.length}
                </span>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2">
                {saved.map(({ line, product }) => (
                  <li key={line.asin} className="flex gap-3 border-[3px] border-ink bg-card p-3 shadow-brut-sm">
                    <Link
                      href={`/product/${product.asin}`}
                      aria-hidden="true"
                      tabIndex={-1}
                      className={`flex h-24 w-24 shrink-0 items-center justify-center border-2 border-ink p-2 ${TINT[product.category]}`}
                    >
                      <img src={product.image} alt="" loading="lazy" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <h3 className="clamp-2 text-[14px] font-semibold leading-snug">
                        <Link href={`/product/${product.asin}`} className="hover:underline">
                          {product.shortTitle}
                        </Link>
                      </h3>
                      <Price cents={product.priceCents} size="sm" />
                      <div className="mt-auto pt-1">
                        <CartLineActions asin={line.asin} saved />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
      </div>

      {recommendations.length > 0 && (
        <section className="mt-16">
          <SectionHeading title="Goes with your haul" />
          <Shelf products={recommendations} label="Recommended for your cart" />
        </section>
      )}
    </Container>
  );
}

/** One active cart line: image well, details, quantity and actions. */
function CartItem({ line, product }: Line) {
  const href = `/product/${product.asin}`;
  const low = product.stock <= 8;

  return (
    <li className="flex gap-4 border-[3px] border-ink bg-card p-3 shadow-brut sm:gap-5 sm:p-4">
      <Link
        href={href}
        aria-hidden="true"
        tabIndex={-1}
        className={`flex h-28 w-28 shrink-0 items-center justify-center border-2 border-ink p-3 sm:h-40 sm:w-40 ${TINT[product.category]}`}
      >
        <img src={product.image} alt="" loading="lazy" className="max-h-full max-w-full object-contain mix-blend-multiply" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">{product.brand}</p>
            <h3 className="clamp-2 mt-0.5 font-display text-[17px] font-bold leading-snug sm:text-[19px]">
              <Link href={href} className="hover:underline">
                {product.shortTitle}
              </Link>
            </h3>
          </div>
          <span className="hidden shrink-0 sm:block">
            <Price cents={product.priceCents * line.qty} size="md" />
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
          {product.express && <ExpressBadge />}
          {low ? (
            <Sticker tone="pink" tilt={0}>
              Only {product.stock} left
            </Sticker>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-mono text-[12px] font-bold uppercase">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full border-2 border-ink bg-lime" />
              In stock
            </span>
          )}
          {line.qty > 1 && <span className="font-mono text-[12px] text-muted">{money(product.priceCents)} each</span>}
        </div>

        <span className="mt-2 sm:hidden">
          <Price cents={product.priceCents * line.qty} size="md" />
        </span>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-3">
          <QtySelect asin={line.asin} value={line.qty} label={`Quantity for ${product.shortTitle}`} />
          <CartLineActions asin={line.asin} saved={false} />
        </div>
      </div>
    </li>
  );
}

async function EmptyCart() {
  const popular = await bestSellers(14);

  return (
    <Container className="pt-8 md:pt-12">
      <section className="brut relative overflow-hidden bg-sky p-8 md:p-12">
        <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-[0.12]" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <Sticker tone="ink" tilt={-2}>
              0 items
            </Sticker>
            <h1 className="mt-5 font-display text-[48px] font-extrabold leading-[0.95] tracking-[-0.03em] md:text-[76px]">
              Your haul is
              <br />
              empty.
            </h1>
            <p className="mt-5 max-w-md text-[17px]">
              Nothing in here yet. Start with the deals, or dig through all ten departments.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/deals" variant="pink" size="lg">
                Shop deals
              </ButtonLink>
              <ButtonLink href="/s" variant="secondary" size="lg">
                Browse everything
              </ButtonLink>
            </div>
          </div>
          <EmptyTote />
        </div>
      </section>

      <section className="mt-16">
        <SectionHeading title="Popular right now" href="/s?sort=reviews" />
        <Shelf products={popular} label="Best sellers" />
      </section>
    </Container>
  );
}

/** A flat, outlined tote bag with nothing in it. */
const EmptyTote = () => (
  <svg viewBox="0 0 200 200" className="mx-auto hidden w-56 -rotate-6 md:block" aria-hidden="true">
    <rect x="34" y="70" width="140" height="118" fill="var(--color-ink)" />
    <path d="M26 62h140l-10 118H36z" fill="var(--color-lime)" stroke="var(--color-ink)" strokeWidth="6" strokeLinejoin="round" />
    <path d="M66 62V46a30 30 0 0 1 60 0v16" fill="none" stroke="var(--color-ink)" strokeWidth="6" strokeLinecap="round" />
    <text x="96" y="132" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="34" fill="var(--color-ink)">
      HAUL
    </text>
  </svg>
);
