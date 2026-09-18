"use client";

import { useState } from "react";

/**
 * On desktop the filter rail is always visible. On phones it collapses
 * behind a toggle — otherwise you scroll past every facet in the store
 * before reaching the first product.
 */
export function FilterPanel({
  children,
  activeCount,
}: {
  children: React.ReactNode;
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="w-full shrink-0 lg:w-[240px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mb-2 flex w-full items-center justify-between gap-2 border border-line bg-white px-4 py-2.5 text-[14px] font-bold text-ink lg:hidden"
      >
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path fill="currentColor" d="M3 5h18v2H3zm3 6h12v2H6zm4 6h4v2h-4z" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-[#007185] px-2 py-0.5 text-[11px] text-white">
              {activeCount}
            </span>
          )}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      <div className={`${open ? "block" : "hidden"} bg-white p-4 lg:block lg:bg-transparent lg:p-0`}>
        {children}
      </div>
    </aside>
  );
}
