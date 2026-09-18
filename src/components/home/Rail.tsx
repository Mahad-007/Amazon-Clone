"use client";

import { useRef } from "react";
import type { Product } from "@/lib/types";
import { RailCard } from "@/components/product/ProductCard";

/**
 * Horizontal product shelf with the overlay arrows Amazon uses. Scrolling is
 * native (so trackpads and touch work untouched); the arrows just nudge the
 * scroll container by roughly one viewport.
 */
export function Rail({
  title,
  products,
  href,
}: {
  title: string;
  products: Product[];
  href?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function nudge(direction: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-white px-5 py-4">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-[21px] font-bold text-ink">{title}</h2>
        {href && (
          <a href={href} className="text-[13px] link-teal">
            See more
          </a>
        )}
      </div>

      <div className="relative">
        <div
          ref={scroller}
          className="rail-scroll flex gap-4 overflow-x-auto scroll-smooth"
        >
          {products.map((p) => (
            <RailCard key={p.asin} product={p} />
          ))}
        </div>

        <RailArrow side="left" onClick={() => nudge(-1)} />
        <RailArrow side="right" onClick={() => nudge(1)} />
      </div>
    </section>
  );
}

function RailArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      className={`absolute top-1/2 hidden h-[90px] w-9 -translate-y-1/2 items-center justify-center border border-line bg-white/95 shadow-md hover:bg-[#f7fafa] md:flex ${
        side === "left" ? "left-0" : "right-0"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 text-ink" aria-hidden="true">
        <path
          fill="currentColor"
          d={
            side === "left"
              ? "M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6z"
              : "M8.6 7.4 10 6l6 6-6 6-1.4-1.4 4.6-4.6z"
          }
        />
      </svg>
    </button>
  );
}
