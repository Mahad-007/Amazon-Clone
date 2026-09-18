"use client";

import { useFormStatus } from "react-dom";
import { removeFromCartForm, toggleSavedForm } from "@/app/actions/cart";

/**
 * "Delete | Save for later" under each cart line. Two small forms rather than
 * click handlers, so they work before hydration and without JavaScript.
 */
export function CartLineActions({
  asin,
  saved,
}: {
  asin: string;
  saved: boolean;
}) {
  return (
    <span className="flex items-center gap-2 text-[13px]">
      <form action={removeFromCartForm}>
        <input type="hidden" name="asin" value={asin} />
        <LinkButton>Delete</LinkButton>
      </form>

      <span className="text-line-strong">|</span>

      <form action={toggleSavedForm}>
        <input type="hidden" name="asin" value={asin} />
        <input type="hidden" name="saved" value={saved ? "1" : "0"} />
        <LinkButton>{saved ? "Move to cart" : "Save for later"}</LinkButton>
      </form>
    </span>
  );
}

function LinkButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="link-teal disabled:opacity-50"
    >
      {children}
    </button>
  );
}
