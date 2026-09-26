import Link from "next/link";
import type { Metadata } from "next";
import { deals } from "@/lib/catalog";
import { percentOff } from "@/lib/format";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Sticker";

export const metadata: Metadata = {
  title: "Deals",
  description: "Everything on sale right now, across every department.",
};

export default async function DealsPage() {
  // Every discounted product, so the counts below are real totals, not a page size.
  const all = await deals(500);
  const off = all.map((p) => percentOff(p.priceCents, p.listPriceCents ?? p.priceCents));
  const deepest = Math.max(0, ...off);
  const saved = all.reduce((n, p) => n + ((p.listPriceCents ?? p.priceCents) - p.priceCents), 0);
  const departments = new Set(all.map((p) => p.category)).size;

  return (
    <Container className="pt-8">
      <section className="brut relative overflow-hidden bg-pink p-6 md:p-10">
        <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-10" />
        <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Sticker tone="ink" tilt={-2}>
              Live prices · updated from the database
            </Sticker>
            <h1 className="mt-5 font-display text-[56px] font-extrabold leading-[0.9] tracking-[-0.03em] md:text-[96px]">
              Up to
              <br />
              <span className="bg-card px-2">{deepest}% off</span>
            </h1>
            <p className="mt-6 max-w-lg text-[17px]">
              Every product with a marked-down price, best discount in each department first, so the page isn’t just
              one department’s clearance rack.
            </p>
          </div>
          <dl className="grid grid-cols-3 border-[3px] border-ink bg-card font-mono md:grid-cols-1">
            {[
              [String(all.length), "on sale"],
              [String(departments), "departments"],
              [`$${Math.round(saved / 100).toLocaleString("en-US")}`, "total markdown"],
            ].map(([n, label], i) => (
              <div
                key={label}
                className={`flex flex-col-reverse px-4 py-3 ${i > 0 ? "border-l-[3px] border-ink md:border-l-0 md:border-t-[3px]" : ""}`}
              >
                <dt className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">{label}</dt>
                <dd className="font-display text-[22px] font-extrabold leading-none md:text-[28px]">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {all.map((p, i) => (
          <li key={p.asin} className="min-w-0">
            <ProductCard product={p} showAddToCart priority={i < 4} />
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-center">
        <p className="font-display text-[20px] font-bold">Looking for something specific?</p>
        <ButtonLink href="/s" variant="secondary">
          Search everything
        </ButtonLink>
        <Link href="/s?deals=1&sort=price-asc" className="link text-[14px] font-semibold">
          Sale items, cheapest first
        </Link>
      </div>
    </Container>
  );
}
