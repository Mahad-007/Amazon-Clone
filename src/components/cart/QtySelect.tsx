"use client";

import { useFormStatus } from "react-dom";
import { setQtyForm } from "@/app/actions/cart";

/**
 * Cart quantity control, as a form.
 *
 * With JavaScript the select submits itself on change. Without it, the
 * <noscript> button submits the same form, so the cart stays usable with
 * scripting off, like the rest of the shopping flow.
 */
export function QtySelect({ asin, value, label }: { asin: string; value: number; label: string }) {
  return (
    <form action={setQtyForm} className="flex items-center gap-2">
      <input type="hidden" name="asin" value={asin} />
      <Select value={value} label={label} />
      <noscript>
        <button
          type="submit"
          className="h-9 rounded-brut border-2 border-ink bg-card px-3 font-mono text-[12px] font-bold uppercase shadow-brut-sm"
        >
          Update
        </button>
      </noscript>
    </form>
  );
}

function Select({ value, label }: { value: number; label: string }) {
  const { pending } = useFormStatus();

  // 1-9 covers nearly every basket; a larger saved quantity stays selectable.
  const options = Array.from({ length: 9 }, (_, i) => i + 1);
  if (value > 9) options.push(value);

  return (
    <label className="flex items-center gap-2">
      <span aria-hidden="true" className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
        Qty
      </span>
      <select
        name="qty"
        aria-label={label}
        defaultValue={value}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-9 cursor-pointer rounded-brut border-2 border-ink bg-sun pl-2.5 pr-1 font-mono text-[14px] font-bold shadow-brut-sm disabled:opacity-60"
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        <option value={0}>0 (remove)</option>
      </select>
    </label>
  );
}
