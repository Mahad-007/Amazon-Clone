"use client";

import { useState } from "react";
import type { Variant } from "@/lib/types";

/**
 * Variant selection is presentational: the catalogue has one listing per
 * product, so picking "Color" does not switch items. That is a deliberate
 * scope cut. The control shows what a real listing looks like without
 * inventing a variant catalogue we don't have.
 */
export function VariantPicker({ variants }: { variants: Variant[] }) {
  if (variants.length === 0) return null;
  return (
    <div className="space-y-4">
      {variants.map((v) => (
        <VariantRow key={v.kind} variant={v} />
      ))}
    </div>
  );
}

function VariantRow({ variant }: { variant: Variant }) {
  const [selected, setSelected] = useState(variant.options[0]);
  return (
    <fieldset>
      <legend className="mb-2 font-mono text-[12px] font-bold uppercase tracking-wider">
        {variant.kind}: <span className="text-muted">{selected}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {variant.options.map((opt) => {
          const on = opt === selected;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setSelected(opt)}
              aria-pressed={on}
              className={`h-10 rounded-brut border-[3px] border-ink px-3.5 text-[14px] font-semibold ${
                on ? "bg-ink text-lime shadow-none" : "bg-card shadow-brut-sm press"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
