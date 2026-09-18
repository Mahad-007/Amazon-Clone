"use client";

import { useTransition } from "react";
import { setQty } from "@/app/actions/cart";

/**
 * Amazon's cart quantity control. Up to 9 as discrete options, then a "10+"
 * escape hatch — reproduced here because jumping straight to a free-text
 * field for every change is worse for the common case.
 */
export function QtySelect({
  asin,
  value,
}: {
  asin: string;
  value: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={value > 9 ? "10+" : String(value)}
      disabled={pending}
      aria-label="Quantity"
      onChange={(e) => {
        const raw = e.target.value;
        const next =
          raw === "10+"
            ? Number(window.prompt("Enter quantity (1–30)", String(value)))
            : Number(raw);
        if (!Number.isFinite(next)) return;
        startTransition(() => setQty(asin, Math.max(0, Math.min(30, next))));
      }}
      className="rounded-lg border border-line bg-[#f0f2f2] px-2 py-1 text-[13px] shadow-sm disabled:opacity-60"
    >
      {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
        <option key={n} value={String(n)}>
          Qty: {n}
        </option>
      ))}
      <option value="10+">{value > 9 ? `Qty: ${value}` : "10+"}</option>
    </select>
  );
}
