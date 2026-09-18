import Link from "next/link";
import type { Metadata } from "next";
import { deals } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { percentOff } from "@/lib/format";

export const metadata: Metadata = {
  title: "Today's Deals",
  description: "Discounted products across every department.",
};

export default function DealsPage() {
  const all = deals(60);
  const best = all[0];
  const deepest = percentOff(best.priceCents, best.listPriceCents ?? best.priceCents);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4">
      <section className="mb-4 overflow-hidden rounded-lg bg-gradient-to-r from-[#0f3d52] to-[#1b7a94] px-6 py-8 text-white">
        <p className="mb-1 text-[13px] uppercase tracking-[0.18em] text-white/75">
          Today&apos;s Deals
        </p>
        <h1 className="mb-2 text-[32px] font-bold leading-tight">
          Up to {deepest}% off
        </h1>
        <p className="max-w-lg text-[15px] text-white/90">
          {all.length} products currently discounted, across every department.
          Every price here is a real scraped Amazon list price against its
          current price.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        {all.map((p) => (
          <div key={p.asin} className="relative">
            <span className="absolute left-4 top-4 z-10 rounded bg-price px-2 py-0.5 text-[12px] font-bold text-white">
              -{percentOff(p.priceCents, p.listPriceCents ?? p.priceCents)}%
            </span>
            <ProductCard product={p} showAddToCart />
          </div>
        ))}
      </div>

      <p className="mt-5 text-center text-[14px] text-[#565959]">
        Looking for something specific?{" "}
        <Link href="/s" className="link-teal">
          Browse all departments
        </Link>
      </p>
    </div>
  );
}
