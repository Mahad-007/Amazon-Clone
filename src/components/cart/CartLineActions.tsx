"use client";

import { useFormStatus } from "react-dom";
import { removeFromCartForm, toggleSavedForm } from "@/app/actions/cart";

/**
 * Delete and Save for later / Move to cart for one line. Two small forms
 * rather than click handlers, so they work before hydration and without
 * JavaScript.
 */
export function CartLineActions({ asin, saved }: { asin: string; saved: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={toggleSavedForm}>
        <input type="hidden" name="asin" value={asin} />
        <input type="hidden" name="saved" value={saved ? "1" : "0"} />
        <ActionButton tone="card">{saved ? "Move to cart" : "Save for later"}</ActionButton>
      </form>
      <form action={removeFromCartForm}>
        <input type="hidden" name="asin" value={asin} />
        <ActionButton tone="plain">Delete</ActionButton>
      </form>
    </div>
  );
}

function ActionButton({ children, tone }: { children: React.ReactNode; tone: "card" | "plain" }) {
  const { pending } = useFormStatus();
  const look =
    tone === "card"
      ? "border-2 border-ink bg-card shadow-brut-sm press hover:bg-lime"
      : "border-2 border-transparent underline decoration-2 underline-offset-4 hover:border-ink hover:bg-pink hover:no-underline";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`h-9 rounded-brut px-3 text-[13px] font-semibold disabled:opacity-50 ${look}`}
    >
      {children}
    </button>
  );
}
