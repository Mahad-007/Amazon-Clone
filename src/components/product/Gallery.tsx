"use client";

import { useState, type ReactNode } from "react";

/**
 * The product photo in a bordered frame on its department tint. Hovering
 * zooms with a scaled background position (no second image request).
 * Thumbnails only appear when a listing actually has more than one photo;
 * the scrape mostly gives one, and three copies of it would be filler.
 */
export function Gallery({
  images,
  alt,
  tint,
  stickers,
}: {
  images: string[];
  alt: string;
  /** Tailwind background class for the frame. */
  tint: string;
  stickers?: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const main = images[index] ?? images[0];

  return (
    <div className="space-y-3">
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden border-[3px] border-ink shadow-brut-lg ${tint}`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-[0.07]" />
        <img
          src={main}
          alt={alt}
          className="relative max-h-[82%] max-w-[82%] object-contain mix-blend-multiply"
        />
        {zoom && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden bg-card bg-no-repeat md:block"
            style={{
              backgroundImage: `url(${main})`,
              backgroundSize: "220%",
              backgroundPosition: `${zoom.x}% ${zoom.y}%`,
            }}
          />
        )}
        {stickers && <div className="absolute left-4 top-4 flex flex-col items-start gap-2">{stickers}</div>}
        <span className="absolute bottom-3 right-3 hidden border-2 border-ink bg-card px-2 font-mono text-[10px] font-bold uppercase leading-5 md:block">
          Hover to zoom
        </span>
      </div>

      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onMouseEnter={() => setIndex(i)}
              onFocus={() => setIndex(i)}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
              aria-current={i === index}
              className={`h-16 w-16 border-[3px] border-ink bg-card p-1 ${i === index ? "shadow-brut-sm" : "opacity-70 hover:opacity-100"}`}
            >
              <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
