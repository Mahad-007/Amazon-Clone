"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import type { Product } from "@/lib/types";
import { Price } from "@/components/ui/Price";
import { addToCartForm, buyNowForm } from "@/app/actions/cart";
import { deliveryDate, formatDelivery } from "@/lib/format";

/**
 * The boxed right-hand column: price, delivery promise, stock, quantity and
 * the two CTAs.
 *
 * It is a real <form> with two submit buttons pointing at different server
 * actions, so quantity + Add to Cart + Buy Now all work before React hydrates
 * and with JavaScript disabled. "Buy Now" adds and redirects to checkout,
 * which is the behaviour the amber button implies.
 */
export function BuyBox({ product }: { product: Product }) {
  const fast = deliveryDate(product.isPrime ? 2 : 5);
  const free = deliveryDate(product.isPrime ? 4 : 8);
  const inStock = product.stock > 0;

  return (
    <form action={addToCartForm} className="rounded-lg border border-line bg-white p-4">
      <input type="hidden" name="asin" value={product.asin} />
      <div className="mb-2">
        <Price cents={product.priceCents} size="lg" />
      </div>

      <p className="mb-3 text-[14px] text-ink">
        FREE Returns{" "}
        <span className="text-[13px] text-[#565959]">
          on eligible orders
        </span>
      </p>

      <p className="mb-1 text-[14px] text-ink">
        FREE delivery{" "}
        <span className="font-bold">{formatDelivery(free)}</span>
      </p>
      <p className="mb-3 text-[14px] text-ink">
        Or fastest delivery{" "}
        <span className="font-bold">{formatDelivery(fast)}</span>
      </p>

      <p className="mb-3 flex items-center gap-1 text-[13px] text-[#565959]">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7m0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5"
          />
        </svg>
        Deliver to United States
      </p>

      {inStock ? (
        <p className="mb-3 text-[18px] text-success">In Stock</p>
      ) : (
        <p className="mb-3 text-[18px] text-price">Currently unavailable</p>
      )}

      {inStock && product.stock <= 8 && (
        <p className="mb-3 text-[14px] text-price">
          Only {product.stock} left in stock — order soon.
        </p>
      )}

      <label className="mb-3 block">
        <span className="sr-only">Quantity</span>
        <select
          name="qty"
          aria-label="Quantity"
          defaultValue={1}
          className="w-full rounded-lg border border-line bg-[#f0f2f2] px-2 py-1.5 text-[13px] shadow-sm"
        >
          {Array.from({ length: Math.min(10, Math.max(1, product.stock)) }, (_, i) => i + 1).map(
            (n) => (
              <option key={n} value={n}>
                Quantity: {n}
              </option>
            ),
          )}
        </select>
      </label>

      <Cta inStock={inStock} />

      <p className="mb-3 flex items-center gap-1.5 text-[12px] link-teal">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#565959]" aria-hidden="true">
          <path
            fill="currentColor"
            d="M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2M9 6a3 3 0 0 1 6 0v2H9Zm3 12a2 2 0 1 1 2-2 2 2 0 0 1-2 2"
          />
        </svg>
        Secure transaction
      </p>

      <dl className="space-y-1 border-t border-line pt-3 text-[13px]">
        <div className="flex gap-2">
          <dt className="w-[70px] shrink-0 text-[#565959]">Ships from</dt>
          <dd className="text-ink">Amazon.com</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-[70px] shrink-0 text-[#565959]">Sold by</dt>
          <dd className="text-ink">{product.brand}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-[70px] shrink-0 text-[#565959]">Returns</dt>
          <dd className="link-teal">30-day refund/replacement</dd>
        </div>
      </dl>

      <Link
        href="/cart"
        className="mt-3 block rounded-full border border-line bg-white py-1.5 text-center text-[13px] text-ink hover:bg-[#f7fafa]"
      >
        Go to Cart
      </Link>
    </form>
  );
}

/**
 * Both CTAs submit the same form; formAction picks which server action runs.
 * useFormStatus disables them together while a submit is in flight.
 */
function Cta({ inStock }: { inStock: boolean }) {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        disabled={!inStock || pending}
        className="mb-2 w-full rounded-full bg-cta py-2 text-[14px] text-ink shadow-sm hover:bg-cta-hover disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add to Cart"}
      </button>

      <button
        type="submit"
        formAction={buyNowForm}
        disabled={!inStock || pending}
        className="mb-3 w-full rounded-full bg-buy py-2 text-[14px] text-ink shadow-sm hover:bg-buy-hover disabled:opacity-60"
      >
        Buy Now
      </button>
    </>
  );
}
