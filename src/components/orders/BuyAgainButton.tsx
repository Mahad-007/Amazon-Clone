"use client";

import { useFormStatus } from "react-dom";
import { addToCartForm } from "@/app/actions/cart";
import { buttonStyles } from "@/components/ui/Button";

/**
 * "Buy it again" is a real form posting to the add-to-cart server action, so
 * it works before hydration and without JavaScript, like every other cart
 * control.
 */
export function BuyAgainButton({ asin }: { asin: string }) {
  return (
    <form action={addToCartForm}>
      <input type="hidden" name="asin" value={asin} />
      <input type="hidden" name="qty" value={1} />
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonStyles({ variant: "secondary", size: "sm" })}>
      {pending ? "Adding…" : "↻ Buy it again"}
    </button>
  );
}
