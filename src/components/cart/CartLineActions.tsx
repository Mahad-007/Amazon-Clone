"use client";

import { useTransition } from "react";
import { moveToCart, removeFromCart, saveForLater } from "@/app/actions/cart";

/** "Delete | Save for later" row under each cart line. */
export function CartLineActions({
  asin,
  saved,
}: {
  asin: string;
  saved: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <span className="flex items-center gap-2 text-[13px]">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => removeFromCart(asin))}
        className="link-teal disabled:opacity-50"
      >
        Delete
      </button>
      <span className="text-line-strong">|</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => (saved ? moveToCart(asin) : saveForLater(asin)))
        }
        className="link-teal disabled:opacity-50"
      >
        {saved ? "Move to cart" : "Save for later"}
      </button>
    </span>
  );
}
