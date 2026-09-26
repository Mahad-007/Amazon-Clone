"use client";

import { useRef } from "react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

/**
 * A horizontal row of product tiles. Scrolling is native (touch, trackpad,
 * shift+wheel, keyboard on the focusable list); the arrow buttons just nudge
 * it by most of a viewport.
 */
export function Shelf({ products, label }: { products: Product[]; label: string }) {
  const scroller = useRef<HTMLUListElement>(null);

  const handleNudge = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <div className="relative">
      <ul
        ref={scroller}
        aria-label={label}
        tabIndex={0}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 pt-1 md:-mx-1 md:px-1"
      >
        {products.map((p) => (
          <li key={p.asin} className="w-[220px] shrink-0 snap-start md:w-[240px]">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      <div className="mt-3 hidden justify-end gap-2 md:flex">
        {([-1, 1] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleNudge(d)}
            aria-label={d === -1 ? "Scroll left" : "Scroll right"}
            className="grid h-10 w-10 place-items-center rounded-brut border-[3px] border-ink bg-card font-bold shadow-brut-sm press"
          >
            {d === -1 ? "←" : "→"}
          </button>
        ))}
      </div>
    </div>
  );
}
