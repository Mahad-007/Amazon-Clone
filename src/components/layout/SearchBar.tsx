"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/types";

/**
 * A real GET form to /s, so search works before hydration and with
 * JavaScript off. Once hydrated it navigates client-side and adds
 * autocomplete from /api/v1/suggest: debounced, and fully keyboard driven
 * (arrows move, Enter picks, Escape closes).
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

  // Keep the fields in sync when navigation changes the query.
  useEffect(() => {
    setQ(params.get("q") ?? "");
    setScope(params.get("c") ?? "all");
  }, [params]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/suggest?q=${encodeURIComponent(term)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions: string[] };
        setItems(data.suggestions);
      } catch {
        // Suggestions are a nicety; a failure must never break search.
        setItems([]);
      }
    }, 140);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const submit = (term = q) => {
    const search = new URLSearchParams();
    if (term.trim()) search.set("q", term.trim());
    if (scope !== "all") search.set("c", scope);
    setQ(term);
    setOpen(false);
    setActive(-1);
    router.push(`/s?${search.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      submit(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  const showList = open && items.length > 0;

  return (
    <div ref={boxRef} className="relative">
      <form
        role="search"
        action="/s"
        method="get"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex h-12 w-full overflow-hidden rounded-brut border-[3px] border-ink bg-card shadow-brut focus-within:shadow-brut-lg"
      >
        <label className="sr-only" htmlFor="search-scope">
          Department
        </label>
        <select
          id="search-scope"
          name="c"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="h-full w-[88px] shrink-0 cursor-pointer border-r-[3px] border-ink bg-sun px-2 font-mono text-[12px] font-bold uppercase focus-visible:outline-none sm:w-[130px]"
        >
          <option value="all">All</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.short}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="search-input">
          Search HAUL
        </label>
        <input
          id="search-input"
          name="q"
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search headphones, LEGO, air fryers…"
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls="search-suggestions"
          aria-activedescendant={active >= 0 ? `suggestion-${active}` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-ink outline-none placeholder:text-muted/70 [&::-webkit-search-cancel-button]:hidden"
        />

        <button
          type="submit"
          aria-label="Search"
          className="flex h-full shrink-0 items-center gap-2 border-l-[3px] border-ink bg-ink px-4 font-display text-[15px] font-bold text-lime hover:bg-cobalt hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="hidden lg:inline">Search</span>
        </button>
      </form>

      {showList && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+8px)] z-50 border-[3px] border-ink bg-card shadow-brut"
        >
          {items.map((s, i) => (
            <li key={s} id={`suggestion-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                tabIndex={-1}
                onMouseEnter={() => setActive(i)}
                onClick={() => submit(s)}
                className={`flex w-full items-center gap-3 border-b-2 border-ink/10 px-3 py-2 text-left text-[15px] last:border-0 ${
                  i === active ? "bg-lime" : ""
                }`}
              >
                <span aria-hidden="true" className="font-mono text-[12px] text-muted">
                  ↗
                </span>
                <span className="truncate">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
