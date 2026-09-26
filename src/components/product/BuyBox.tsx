"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import type { Product } from "@/lib/types";
import { addToCartForm, buyNowForm } from "@/app/actions/cart";
import { buttonStyles } from "@/components/ui/Button";
import { deliveryDate, formatDelivery } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";

/**
 * The buy panel: stock, delivery promise, quantity and the two CTAs.
 *
 * It is a real <form> with two submit buttons pointing at different server
 * actions, so quantity + Add to Cart + Buy now all work before React
 * hydrates and with JavaScript disabled. "Buy now" adds, then goes straight
 * to checkout.
 */
export function BuyBox({ product }: { product: Product }) {
  const arrives = deliveryDate(product.express ? 2 : 5);
  const inStock = product.stock > 0;
  const low = inStock && product.stock <= 8;
  const freeShipping = product.priceCents >= FREE_SHIPPING_THRESHOLD;

  return (
    <form action={addToCartForm} className="border-[3px] border-ink bg-card shadow-brut">
      <input type="hidden" name="asin" value={product.asin} />

      <div
        className={`flex items-center justify-between gap-2 border-b-[3px] border-ink px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-wider ${
          inStock ? (low ? "bg-pink" : "bg-lime") : "bg-paper-deep"
        }`}
      >
        <span>{inStock ? (low ? `Only ${product.stock} left` : "In stock") : "Sold out"}</span>
        <span>{product.express ? "⚡ Express" : "Standard"}</span>
      </div>

      <div className="space-y-4 p-4">
        <dl className="space-y-1.5 text-[14px]">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Arrives</dt>
            <dd className="text-right font-semibold">{formatDelivery(arrives)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Shipping</dt>
            <dd className="text-right font-semibold">
              {freeShipping ? "Free" : "Free on orders over $35"}
            </dd>
          </div>
        </dl>

        <label className="block">
          <span className="mb-1.5 block font-mono text-[12px] font-bold uppercase tracking-wider">Quantity</span>
          <select
            name="qty"
            defaultValue={1}
            disabled={!inStock}
            className="h-12 w-full cursor-pointer rounded-brut border-[3px] border-ink bg-paper px-3 text-[15px] font-semibold"
          >
            {Array.from({ length: Math.min(10, Math.max(1, product.stock)) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <Cta inStock={inStock} />

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t-2 border-dashed border-ink pt-3 font-mono text-[12px]">
          <dt className="text-muted">Ships from</dt>
          <dd>HAUL</dd>
          <dt className="text-muted">Sold by</dt>
          <dd className="truncate">{product.brand}</dd>
          <dt className="text-muted">Returns</dt>
          <dd>30 days, free</dd>
        </dl>

        <Link href="/cart" className="link block text-center font-mono text-[12px] font-bold uppercase">
          Go to cart →
        </Link>
      </div>
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
    <div className="space-y-3">
      <button type="submit" disabled={!inStock || pending} className={buttonStyles({ size: "lg", block: true })}>
        {pending ? "Adding…" : "Add to Cart"}
      </button>
      <button
        type="submit"
        formAction={buyNowForm}
        disabled={!inStock || pending}
        className={buttonStyles({ variant: "ink", size: "lg", block: true })}
      >
        Buy now
      </button>
    </div>
  );
}
