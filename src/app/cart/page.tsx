import Link from "next/link";
import type { Metadata } from "next";
import { readCart } from "@/lib/cart";
import { getProduct, bestSellers } from "@/lib/catalog";
import { money } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { Price } from "@/components/ui/Price";
import { QtySelect } from "@/components/cart/QtySelect";
import { CartLineActions } from "@/components/cart/CartLineActions";
import { Rail } from "@/components/home/Rail";
import { PrimeBadge } from "@/components/ui/PrimeBadge";

export const metadata: Metadata = { title: "Shopping Cart" };

// The cart is per-request state, so this page can never be prerendered.
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const lines = await readCart();

  const active = lines
    .filter((l) => !l.saved)
    .map((l) => ({ line: l, product: getProduct(l.asin) }))
    .filter((x) => x.product);

  const saved = lines
    .filter((l) => l.saved)
    .map((l) => ({ line: l, product: getProduct(l.asin) }))
    .filter((x) => x.product);

  const itemCount = active.reduce((n, x) => n + x.line.qty, 0);
  const subtotal = active.reduce(
    (n, x) => n + (x.product?.priceCents ?? 0) * x.line.qty,
    0,
  );

  if (active.length === 0 && saved.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1">
          <section className="bg-white px-5 py-4">
            <div className="flex items-baseline justify-between border-b border-line pb-2">
              <h1 className="text-[28px] text-ink">Shopping Cart</h1>
              <span className="hidden text-[13px] text-[#565959] sm:inline">
                Price
              </span>
            </div>

            {active.length === 0 ? (
              <p className="py-6 text-[14px] text-[#565959]">
                Your Shopping Cart is empty. Items you save for later appear
                below.
              </p>
            ) : (
              <ul>
                {active.map(({ line, product }) => (
                  <li
                    key={line.asin}
                    className="flex gap-4 border-b border-line py-4 last:border-b-0"
                  >
                    <Link
                      href={`/product/${product!.asin}`}
                      className="flex h-[140px] w-[140px] shrink-0 items-center justify-center sm:h-[180px] sm:w-[180px]"
                    >
                      <img
                        src={product!.image}
                        alt={product!.title}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex justify-between gap-4">
                        <Link href={`/product/${product!.asin}`}>
                          <h2 className="clamp-2 text-[18px] leading-6 link-teal">
                            {product!.title}
                          </h2>
                        </Link>
                        <span className="hidden shrink-0 sm:block">
                          <Price
                            cents={product!.priceCents * line.qty}
                            size="md"
                          />
                        </span>
                      </div>

                      <p className="mt-1 text-[12px] text-success">In Stock</p>

                      {product!.isPrime && (
                        <div className="mt-0.5">
                          <PrimeBadge />
                        </div>
                      )}

                      {product!.stock <= 8 && (
                        <p className="mt-0.5 text-[12px] text-price">
                          Only {product!.stock} left — order soon.
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <QtySelect asin={line.asin} value={line.qty} />
                        <span className="text-line-strong">|</span>
                        <CartLineActions asin={line.asin} saved={false} />
                      </div>

                      <span className="mt-2 sm:hidden">
                        <Price cents={product!.priceCents * line.qty} size="md" />
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {active.length > 0 && (
              <p className="pt-3 text-right text-[18px] text-ink">
                Subtotal ({itemCount} item{itemCount === 1 ? "" : "s"}):{" "}
                <span className="font-bold">{money(subtotal)}</span>
              </p>
            )}
          </section>

          {saved.length > 0 && (
            <section className="mt-4 bg-white px-5 py-4">
              <h2 className="mb-2 border-b border-line pb-2 text-[21px] text-ink">
                Saved for later ({saved.length})
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {saved.map(({ line, product }) => (
                  <li key={line.asin} className="flex gap-3 py-2">
                    <Link
                      href={`/product/${product!.asin}`}
                      className="flex h-[110px] w-[110px] shrink-0 items-center justify-center"
                    >
                      <img
                        src={product!.image}
                        alt={product!.title}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link href={`/product/${product!.asin}`}>
                        <h3 className="clamp-2 text-[14px] link-teal">
                          {product!.shortTitle}
                        </h3>
                      </Link>
                      <div className="mt-1">
                        <Price cents={product!.priceCents} size="sm" />
                      </div>
                      <div className="mt-1.5">
                        <CartLineActions asin={line.asin} saved />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ------------------------------------------------ checkout box */}
        {active.length > 0 && (
          <aside className="w-full shrink-0 lg:w-[300px]">
            <div className="bg-white px-5 py-4">
              {subtotal >= FREE_SHIPPING_THRESHOLD && (
                <p className="mb-2 flex items-start gap-1.5 text-[13px] text-ink">
                  <span className="mt-0.5 text-success" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    Your order qualifies for FREE Shipping.
                  </span>
                </p>
              )}

              <p className="mb-3 text-[18px] text-ink">
                Subtotal ({itemCount} item{itemCount === 1 ? "" : "s"}):{" "}
                <span className="font-bold">{money(subtotal)}</span>
              </p>

              <Link
                href="/checkout"
                className="block rounded-full bg-cta py-2 text-center text-[14px] text-ink shadow-sm hover:bg-cta-hover"
              >
                Proceed to checkout
              </Link>
            </div>
          </aside>
        )}
      </div>

      <div className="mt-4">
        <Rail title="Customers who bought items in your cart also bought" products={bestSellers(14)} />
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4">
      <div className="flex flex-col items-center gap-6 bg-white px-6 py-10 sm:flex-row sm:items-start">
        <svg
          viewBox="0 0 24 24"
          className="h-[120px] w-[120px] shrink-0 text-[#d5d9d9]"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M7 18a2 2 0 1 0 2 2 2 2 0 0 0-2-2m10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2M7.2 14.6h9.3c.75 0 1.41-.41 1.75-1.03l3.24-5.88A.75.75 0 0 0 20.83 6.6H6.21l-.71-1.5H2v1.5h2.3l3.3 6.96-1.24 2.24A1.5 1.5 0 0 0 7.2 17.1h12v-1.5H7.6a.19.19 0 0 1-.17-.28z"
          />
        </svg>

        <div>
          <h1 className="mb-2 text-[28px] text-ink">
            Your Amazon Cart is empty
          </h1>
          <p className="mb-4 text-[14px] text-[#565959]">
            Check your Saved for later items below, or continue shopping.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-cta px-5 py-1.5 text-[14px] text-ink hover:bg-cta-hover"
            >
              Continue shopping
            </Link>
            <Link
              href="/deals"
              className="rounded-full border border-line bg-white px-5 py-1.5 text-[14px] text-ink hover:bg-[#f7fafa]"
            >
              Today&apos;s Deals
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Rail title="Best Sellers" products={bestSellers(14)} />
      </div>
    </div>
  );
}
