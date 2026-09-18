"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/app/actions/cart";

/**
 * Optimistic-feeling add to cart. The server action revalidates the header
 * count, so the only local state we need is the brief "Added" confirmation.
 */
export function AddToCartButton({
  asin,
  qty = 1,
  compact = false,
  label = "Add to cart",
}: {
  asin: string;
  qty?: number;
  compact?: boolean;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function handleClick() {
    startTransition(async () => {
      await addToCart(asin, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 1600);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`w-full rounded-full bg-cta text-[13px] text-ink shadow-sm transition-colors hover:bg-cta-hover disabled:opacity-60 ${
        compact ? "py-1.5" : "py-2 text-[14px]"
      }`}
    >
      {added ? "Added ✓" : pending ? "Adding…" : label}
    </button>
  );
}
