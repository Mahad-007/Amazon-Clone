"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Slide = {
  eyebrow: string;
  headline: string;
  sub: string;
  href: string;
  cta: string;
  from: string;
  to: string;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Deals of the day",
    headline: "Up to 60% off top tech",
    sub: "Headphones, laptops and 4K TVs from the brands people actually buy.",
    href: "/deals",
    cta: "Shop all deals",
    from: "#0f3d52",
    to: "#1b7a94",
  },
  {
    eyebrow: "New arrivals",
    headline: "Set up your desk",
    sub: "Laptops, mechanical keyboards and everything in between.",
    href: "/s?c=computers",
    cta: "Shop computers",
    from: "#232f3e",
    to: "#3f5872",
  },
  {
    eyebrow: "Home & Kitchen",
    headline: "Cook more, wash less",
    sub: "Air fryers and espresso machines with dishwasher-safe everything.",
    href: "/s?c=home-kitchen",
    cta: "Shop kitchen",
    from: "#5c3b1e",
    to: "#a9713a",
  },
  {
    eyebrow: "Books",
    headline: "Your next favourite read",
    sub: "Bestselling fiction, in paperback, Kindle and Audible.",
    href: "/s?c=books",
    cta: "Shop books",
    from: "#1d3b2a",
    to: "#3f7d5a",
  },
];

/**
 * Amazon's hero is a slow auto-advancing carousel whose bottom edge is
 * covered by the first row of category cards. Auto-advance pauses on hover
 * and is skipped entirely for anyone who prefers reduced motion.
 */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = setInterval(() => go(index + 1), 6000);
    return () => clearInterval(timer);
  }, [index, paused, go]);

  const slide = SLIDES[index];

  return (
    <section
      className="relative h-[380px] overflow-hidden sm:h-[440px] md:h-[520px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      {SLIDES.map((s, i) => (
        <div
          key={s.headline}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: i === index ? 1 : 0,
            background: `linear-gradient(115deg, ${s.from} 0%, ${s.to} 100%)`,
            pointerEvents: i === index ? "auto" : "none",
          }}
          aria-hidden={i !== index}
        >
          <div className="mx-auto flex h-full max-w-[1500px] items-start px-6 pt-10 sm:pt-14 md:px-12">
            <div className="max-w-xl text-white">
              <p className="mb-2 text-[13px] uppercase tracking-[0.18em] text-white/75">
                {s.eyebrow}
              </p>
              <h2 className="mb-3 text-[32px] font-bold leading-tight sm:text-[44px]">
                {s.headline}
              </h2>
              <p className="mb-5 max-w-md text-[15px] text-white/90">{s.sub}</p>
              <Link
                href={s.href}
                className="inline-block rounded-full bg-cta px-5 py-2 text-[14px] font-medium text-ink hover:bg-cta-hover"
              >
                {s.cta}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* The canvas-coloured fade the category cards sit on top of. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70px] bg-gradient-to-b from-transparent to-canvas sm:h-[95px] md:h-[130px]" />

      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Previous slide"
        className="absolute left-0 top-0 hidden h-[70%] w-12 items-center justify-center text-white/80 hover:bg-white/10 hover:text-white sm:flex md:w-16"
      >
        <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden="true">
          <path fill="currentColor" d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Next slide"
        className="absolute right-0 top-0 hidden h-[70%] w-12 items-center justify-center text-white/80 hover:bg-white/10 hover:text-white sm:flex md:w-16"
      >
        <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden="true">
          <path fill="currentColor" d="M8.6 7.4 10 6l6 6-6 6-1.4-1.4 4.6-4.6z" />
        </svg>
      </button>

      <div className="absolute bottom-[70px] left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-[96px] md:bottom-[140px]">
        {SLIDES.map((s, i) => (
          <button
            key={s.headline}
            type="button"
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
