"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/types";

/**
 * Amazon's search: a department scope on the left, the input, and the amber
 * submit button. The suggestion dropdown is fetched from a route handler and
 * debounced, and it is fully keyboard navigable — arrow keys move a
 * highlight, Enter submits it, Escape closes.
 */
export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [scope, setScope] = useState(params.get("c") ?? "all");
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const boxRef = useRef<HTMLDivElement>(null);

  // Keep the input in sync when navigation changes the query.
  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  // Debounced suggestion fetch.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions: string[] };
        setItems(data.suggestions);
      } catch {
        // Suggestions are a nicety; a failure here must not break search.
        setItems([]);
      }
    }, 140);

    return () => clearTimeout(timer);
  }, [q]);

  // Close the dropdown on any outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(term = q) {
    const search = new URLSearchParams();
    if (term.trim()) search.set("q", term.trim());
    if (scope !== "all") search.set("c", scope);
    setOpen(false);
    setActive(-1);
    router.push(`/s?${search.toString()}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) {
      if (e.key === "Enter") submit();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit(active >= 0 ? items[active] : q);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div ref={boxRef} className="relative flex-1">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex h-10 w-full overflow-hidden rounded-[4px] focus-within:amz-focus"
      >
        <label className="sr-only" htmlFor="search-scope">
          Search department
        </label>
        <select
          id="search-scope"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="h-full w-[52px] shrink-0 cursor-pointer border-r border-[#cdcdcd] bg-[#e6e6e6] px-1 text-[12px] text-[#555] hover:bg-[#dadada] sm:w-auto sm:px-2"
        >
          <option value="all">All</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.short}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="search-input">
          Search Amazon
        </label>
        <input
          id="search-input"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search Amazon"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-white px-3 text-[15px] text-ink outline-none"
        />

        <button
          type="submit"
          aria-label="Go"
          className="flex h-full w-[45px] shrink-0 items-center justify-center bg-search hover:bg-search-hover"
        >
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] text-[#111]" aria-hidden="true">
            <path
              fill="currentColor"
              d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"
            />
          </svg>
        </button>
      </form>

      {open && items.length > 0 && (
        <ul className="absolute inset-x-0 top-[calc(100%+1px)] z-50 overflow-hidden rounded-b border border-line bg-white shadow-lg">
          {items.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => submit(s)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[14px] text-ink ${
                  i === active ? "bg-[#f0f2f2]" : ""
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#767676]" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"
                  />
                </svg>
                <span className="truncate">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
