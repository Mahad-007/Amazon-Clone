import Link from "next/link";
import { byCategory, deals, listCategories, searchProducts, topRated, under } from "@/lib/catalog";
import { money, percentOff } from "@/lib/format";
import { TINT } from "@/lib/tint";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { Shelf } from "@/components/product/Shelf";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ButtonLink } from "@/components/ui/Button";
import { Marquee } from "@/components/ui/Marquee";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sticker } from "@/components/ui/Sticker";
import { Price } from "@/components/ui/Price";
import { RatingLine } from "@/components/ui/Stars";

const TILE_TONES = ["bg-lime", "bg-pink", "bg-sun", "bg-sky", "bg-card"];

/**
 * An editorial front page rather than a carousel: one loud statement, the
 * best live deal, a ticker, then departments and shelves. Every number and
 * product on it is a query against Postgres (cached under the catalogue tag).
 */
export default async function HomePage() {
  const [categories, dealList, cheap, rated, expressCount, dealCount] = await Promise.all([
    listCategories(),
    deals(16),
    under(2500, 14),
    topRated(5),
    searchProducts({ expressOnly: true, pageSize: 1 }).then((r) => r.total),
    searchProducts({ dealsOnly: true, pageSize: 1 }).then((r) => r.total),
  ]);
  // Each department's two most popular products: the first goes into
  // "Trending" (so it spans departments instead of being all books, which
  // dominate raw review counts), the second decorates the department tile.
  const tops = await Promise.all(categories.map((c) => byCategory(c.slug, 2)));
  const trending = tops.map((t) => t[0]).filter(Boolean).slice(0, 8);
  const covers = tops.map((t) => t[1] ?? t[0]);

  const hero = dealList[0];
  const heroOff = hero?.listPriceCents ? percentOff(hero.priceCents, hero.listPriceCents) : 0;
  const productCount = categories.reduce((n, c) => n + c.count, 0);

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <Container className="pt-8 md:pt-12">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <section className="brut relative overflow-hidden bg-sun p-6 md:p-10">
            <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-[0.12]" />
            <div className="relative">
              <Sticker tone="ink" tilt={-2}>
                New season · {productCount} products
              </Sticker>
              <h1 className="mt-5 font-display text-[52px] font-extrabold leading-[0.92] tracking-[-0.035em] sm:text-[72px] md:text-[92px]">
                Stuff worth
                <br />
                <span className="relative inline-block">
                  <span aria-hidden="true" className="absolute -bottom-0.5 left-0 h-4 w-full bg-pink md:h-6" />
                  <span className="relative">hauling</span>
                </span>
                .
              </h1>
              <p className="mt-6 max-w-md text-[17px] leading-relaxed">
                Headphones, LEGO, air fryers, running shoes and the rest. Real prices, real ratings, a cart that remembers
                you, and checkout in one page.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href="/deals" variant="pink" size="lg">
                  Shop {dealCount} deals
                </ButtonLink>
                <ButtonLink href="/s" variant="secondary" size="lg">
                  Browse everything
                </ButtonLink>
              </div>
              <dl className="mt-9 grid max-w-md grid-cols-3 border-[3px] border-ink bg-card font-mono">
                {[
                  [String(productCount), "products"],
                  [String(categories.length), "departments"],
                  [String(expressCount), "on Express"],
                ].map(([n, label], i) => (
                  <div key={label} className={`flex flex-col-reverse px-3 py-2.5 ${i > 0 ? "border-l-[3px] border-ink" : ""}`}>
                    <dt className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">{label}</dt>
                    <dd className="font-display text-[26px] font-extrabold leading-none">{n}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {hero && (
            <section aria-labelledby="deal-of-the-day" className="brut relative flex flex-col bg-pink">
              <div className="flex items-center justify-between border-b-[3px] border-ink bg-ink px-4 py-2">
                <h2 id="deal-of-the-day" className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-pink">
                  Deal of the day
                </h2>
                <span className="font-mono text-[12px] text-paper/80">{hero.brand}</span>
              </div>
              <Link
                href={`/product/${hero.asin}`}
                aria-label={hero.shortTitle}
                className="group relative flex flex-1 items-center justify-center p-6"
              >
                <img
                  src={hero.image}
                  alt=""
                  className="max-h-[300px] w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-105"
                />
                {heroOff > 0 && (
                  <span className="absolute right-4 top-4 grid h-24 w-24 rotate-12 place-items-center rounded-full border-[3px] border-ink bg-lime font-display text-[30px] font-extrabold shadow-brut">
                    -{heroOff}%
                  </span>
                )}
              </Link>
              <div className="border-t-[3px] border-ink bg-card p-4">
                <p className="clamp-2 font-display text-[19px] font-bold leading-tight">
                  <Link href={`/product/${hero.asin}`} className="hover:underline">
                    {hero.shortTitle}
                  </Link>
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Price cents={hero.priceCents} size="lg" />
                    {hero.listPriceCents && (
                      <span className="font-mono text-[13px] text-muted line-through decoration-2">
                        {money(hero.listPriceCents)}
                      </span>
                    )}
                  </div>
                  <RatingLine rating={hero.rating} count={hero.reviewCount} />
                </div>
                <div className="mt-4">
                  <AddToCartButton asin={hero.asin} />
                </div>
              </div>
            </section>
          )}
        </div>
      </Container>

      {/* --------------------------------------------------------- ticker */}
      <div className="mt-10">
        <Marquee label="Today's biggest discounts">
          {dealList.map((p) => (
            <Link
              key={p.asin}
              href={`/product/${p.asin}`}
              className="flex items-center gap-3 whitespace-nowrap px-5 py-3 font-mono text-[13px] font-bold uppercase hover:text-lime"
            >
              <span aria-hidden="true" className="text-lime">
                ✦
              </span>
              {p.brand}
              <span className="bg-pink px-1.5 text-ink">
                -{percentOff(p.priceCents, p.listPriceCents ?? p.priceCents)}%
              </span>
              {money(p.priceCents)}
            </Link>
          ))}
        </Marquee>
      </div>

      <Container className="space-y-16 pt-14">
        {/* ------------------------------------------------ departments */}
        <section>
          <SectionHeading index="01" title="Departments" href="/s" linkLabel="All products" />
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c, i) => (
              <li key={c.slug}>
                <Link
                  href={`/s?c=${c.slug}`}
                  className={`group relative flex h-full min-h-[170px] flex-col overflow-hidden border-[3px] border-ink p-4 shadow-brut press ${TILE_TONES[i % TILE_TONES.length]}`}
                >
                  <span className="font-mono text-[12px] font-bold">{String(i + 1).padStart(2, "0")}</span>
                  <span className="relative z-10 mt-1 max-w-[70%] font-display text-[21px] font-extrabold leading-[1.05]">
                    {c.short}
                  </span>
                  <span className="relative z-10 mt-auto font-mono text-[12px] font-bold uppercase">
                    {c.count} items →
                  </span>
                  {covers[i] && (
                    <img
                      src={covers[i].image}
                      alt=""
                      loading="lazy"
                      className="absolute -bottom-3 -right-3 h-20 w-20 rotate-6 sm:h-28 sm:w-28 object-contain mix-blend-multiply transition-transform duration-200 group-hover:rotate-0 group-hover:scale-110"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* --------------------------------------------------- trending */}
        <section>
          <SectionHeading index="02" title="Trending now" href="/s?sort=reviews" />
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {trending.map((p, i) => (
              <li key={p.asin}>
                <ProductCard product={p} priority={i < 4} />
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------- under $25 */}
        <section>
          <SectionHeading index="03" title="Under $25" href="/s?max=2500&sort=reviews" />
          <Shelf products={cheap} label="Products under $25" />
        </section>

        {/* ------------------------------------- top rated + express */}
        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="min-w-0">
            <SectionHeading index="04" title="Top rated" href="/s?sort=rating" />
            <ol className="border-[3px] border-ink bg-card shadow-brut">
              {rated.map((p, i) => (
                <li key={p.asin} className={i > 0 ? "border-t-[3px] border-ink" : ""}>
                  <Link href={`/product/${p.asin}`} className="group flex items-center gap-4 p-3 pr-4 hover:bg-sun">
                    <span className="w-10 shrink-0 text-center font-display text-[44px] font-extrabold leading-none text-ink/25 group-hover:text-ink">
                      {i + 1}
                    </span>
                    <span className={`grid h-16 w-16 shrink-0 place-items-center border-2 border-ink ${TINT[p.category]}`}>
                      <img src={p.image} alt="" loading="lazy" className="h-14 w-14 object-contain mix-blend-multiply" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="clamp-1 font-semibold">{p.shortTitle}</span>
                      <RatingLine rating={p.rating} count={p.reviewCount} size={12} />
                    </span>
                    <span className="hidden shrink-0 sm:block">
                      <Price cents={p.priceCents} size="sm" />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <aside className="brut flex flex-col justify-between gap-6 bg-lime p-6 md:p-8 lg:mt-[60px]">
            <div>
              <p className="font-mono text-[12px] font-bold uppercase tracking-[0.16em]">HAUL Express</p>
              <p className="mt-3 font-display text-[40px] font-extrabold leading-[0.95] tracking-tight md:text-[52px]">
                Two days.
                <br />
                Free over $35.
              </p>
              <p className="mt-4 max-w-xs text-[16px]">
                {expressCount} products ship Express. Filter for them anywhere with one tap.
              </p>
            </div>
            <ButtonLink href="/s?express=1" variant="ink" size="lg" className="self-start">
              Shop Express
            </ButtonLink>
          </aside>
        </section>

        {/* ------------------------------------------------------ deals */}
        <section>
          <SectionHeading index="05" title="Deals across the store" href="/deals" />
          <Shelf products={dealList} label="Deals" />
        </section>
      </Container>
    </>
  );
}
