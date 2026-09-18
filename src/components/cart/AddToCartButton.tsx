"use client";

import { useFormStatus } from "react-dom";
import { addToCartForm } from "@/app/actions/cart";

/**
 * A real form posting to a server action, so the button works from the moment
 * the HTML lands — before React hydrates, and with JavaScript off entirely.
 * useFormStatus supplies the pending state once hydration does happen.
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
  return (
    <form action={addToCartForm} className="w-full">
      <input type="hidden" name="asin" value={asin} />
      <input type="hidden" name="qty" value={qty} />
      <Submit compact={compact} label={label} />
    </form>
  );
}

function Submit({ compact, label }: { compact: boolean; label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full rounded-full bg-cta text-[13px] text-ink shadow-sm transition-colors hover:bg-cta-hover disabled:opacity-60 ${
        compact ? "py-1.5" : "py-2 text-[14px]"
      }`}
    >
      {pending ? "Adding…" : label}
    </button>
  );
}
