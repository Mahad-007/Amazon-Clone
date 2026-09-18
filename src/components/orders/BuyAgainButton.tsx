"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/app/actions/cart";

export function BuyAgainButton({ asin }: { asin: string }) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await addToCart(asin, 1);
          setAdded(true);
          setTimeout(() => setAdded(false), 1600);
        })
      }
      className="w-full rounded-full bg-cta py-1.5 text-[13px] text-ink hover:bg-cta-hover disabled:opacity-60"
    >
      {added ? "Added ✓" : pending ? "Adding…" : "Buy it again"}
    </button>
  );
}
