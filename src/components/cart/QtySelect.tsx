"use client";

import { useFormStatus } from "react-dom";
import { setQtyForm } from "@/app/actions/cart";

/**
 * Amazon's cart quantity control, as a form.
 *
 * With JavaScript the select submits itself on change, which is the
 * interaction people expect. Without it, the <noscript> button submits the
 * same form — so the cart stays usable with scripting off, like the rest of
 * the shopping flow.
 */
export function QtySelect({ asin, value }: { asin: string; value: number }) {
  return (
    <form action={setQtyForm} className="flex items-center gap-1.5">
      <input type="hidden" name="asin" value={asin} />
      <Select value={value} />
      <noscript>
        <button
          type="submit"
          className="rounded-lg border border-line bg-[#f0f2f2] px-2 py-1 text-[13px]"
        >
          Update
        </button>
      </noscript>
    </form>
  );
}

function Select({ value }: { value: number }) {
  const { pending } = useFormStatus();

  // Amazon lists 1-9 discretely and then an escape hatch; quantities above
  // nine are rare enough that a prompt beats a permanently wider control.
  const options = Array.from({ length: 9 }, (_, i) => i + 1);
  if (value > 9) options.push(value);

  return (
    <select
      name="qty"
      aria-label="Quantity"
      defaultValue={value}
      disabled={pending}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-lg border border-line bg-[#f0f2f2] px-2 py-1 text-[13px] shadow-sm disabled:opacity-60"
    >
      {options.map((n) => (
        <option key={n} value={n}>
          Qty: {n}
        </option>
      ))}
      <option value={0}>0 (delete)</option>
    </select>
  );
}
