"use client";

import { useState } from "react";

/**
 * Amazon's gallery: a thumbnail column that swaps the main image on hover,
 * and a magnifier that follows the cursor. The zoom uses a scaled background
 * position rather than a second <img>, so there's no extra network request.
 */
export function Gallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const main = images[index] ?? images[0];

  return (
    <div className="flex gap-3">
      {images.length > 1 && (
        <div className="flex shrink-0 flex-col gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onMouseEnter={() => setIndex(i)}
              onFocus={() => setIndex(i)}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
              aria-current={i === index}
              className={`h-[52px] w-[52px] overflow-hidden rounded border bg-white p-1 ${
                i === index
                  ? "border-[#e77600] shadow-[0_0_3px_2px_rgba(228,121,17,.5)]"
                  : "border-line hover:border-[#e77600]"
              }`}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}

      <div
        className="relative flex min-h-[340px] flex-1 items-center justify-center overflow-hidden bg-white sm:min-h-[460px]"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({
            x: ((e.clientX - r.left) / r.width) * 100,
            y: ((e.clientY - r.top) / r.height) * 100,
          });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <img
          src={main}
          alt={alt}
          className="max-h-[460px] max-w-full object-contain"
        />

        {zoom && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden bg-white bg-no-repeat md:block"
            style={{
              backgroundImage: `url(${main})`,
              backgroundSize: "200%",
              backgroundPosition: `${zoom.x}% ${zoom.y}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}
