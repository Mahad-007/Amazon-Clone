"use client";

import { useState } from "react";
import type { Variant } from "@/lib/types";

/**
 * Variant selection is presentational here: the catalogue has one ASIN per
 * listing, so switching "Color" does not switch products. Shipping it this
 * way is a deliberate scope cut — the control communicates the shape of a
 * real listing without inventing a variant catalogue we don't have.
 */
export function VariantPicker({ variants }: { variants: Variant[] }) {
  if (variants.length === 0) return null;

  return (
    <div className="space-y-3">
      {variants.map((v) => (
        <VariantRow key={v.kind} variant={v} />
      ))}
    </div>
  );
}

function VariantRow({ variant }: { variant: Variant }) {
  const [selected, setSelected] = useState(variant.options[0]);

  return (
    <div>
      <p className="mb-1.5 text-[14px] text-ink">
        <span className="font-bold">{variant.kind}:</span>{" "}
        <span>{selected}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {variant.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setSelected(opt)}
            aria-pressed={opt === selected}
            className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
              opt === selected
                ? "border-[#007185] bg-[#e3f2f4] font-medium text-ink shadow-[0_0_0_2px_rgba(0,113,133,.2)]"
                : "border-line bg-white text-ink hover:border-[#007185]"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
