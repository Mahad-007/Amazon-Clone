"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Product } from "@/lib/types";
import { Price } from "@/components/ui/Price";
import { addToCart } from "@/app/actions/cart";
import { deliveryDate, formatDelivery } from "@/lib/format";

/**
 * The boxed right-hand column: price, delivery promise, stock, quantity and
 * the two CTAs. "Buy now" adds to the cart and jumps straight to checkout,
 * which is the behaviour shoppers expect from the amber button.
 */
export function BuyBox({ product }: { product: Product }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const fast = deliveryDate(product.isPrime ? 2 : 5);
  const free = deliveryDate(product.isPrime ? 4 : 8);
  const inStock = product.stock > 0;

  function add(then?: () => void) {
    startTransition(async () => {
      await addToCart(product.asin, qty);
      if (then) then();
      else {
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      }
    });
  }

  return (
    <div className="rounded-lg border border-line bg-white p-4">
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
          aria-label="Quantity"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
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

      <button
        type="button"
        disabled={!inStock || pending}
        onClick={() => add()}
        className="mb-2 w-full rounded-full bg-cta py-2 text-[14px] text-ink shadow-sm hover:bg-cta-hover disabled:opacity-60"
      >
        {added ? "Added to cart ✓" : pending ? "Adding…" : "Add to Cart"}
      </button>

      <button
        type="button"
        disabled={!inStock || pending}
        onClick={() => add(() => router.push("/checkout"))}
        className="mb-3 w-full rounded-full bg-buy py-2 text-[14px] text-ink shadow-sm hover:bg-buy-hover disabled:opacity-60"
      >
        Buy Now
      </button>

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
    </div>
  );
}
