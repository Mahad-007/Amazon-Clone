import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, related, alsoViewed } from "@/lib/catalog";
import { listReviews, myReviewId, reviewHistogram } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/types";
import { TINT } from "@/lib/tint";
import { compactCount, percentOff } from "@/lib/format";
import { Container } from "@/components/layout/Container";
import { Gallery } from "@/components/product/Gallery";
import { VariantPicker } from "@/components/product/VariantPicker";
import { BuyBox } from "@/components/product/BuyBox";
import { Reviews } from "@/components/product/Reviews";
import { Shelf } from "@/components/product/Shelf";
import { WishlistButton } from "@/components/product/WishlistButton";
import { ExpressBadge } from "@/components/ui/ExpressBadge";
import { PriceBlock } from "@/components/ui/Price";
import { RatingLine } from "@/components/ui/Stars";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sticker } from "@/components/ui/Sticker";

export async function generateMetadata({ params }: { params: Promise<{ asin: string }> }): Promise<Metadata> {
  const { asin } = await params;
  const product = await getProduct(asin);
  if (!product) return { title: "Product not found" };

  return {
    title: product.shortTitle,
    description: product.bullets[0],
    openGraph: { title: product.shortTitle, images: [product.images[0]] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ asin: string }> }) {
  const { asin } = await params;
  const product = await getProduct(asin);
  if (!product) notFound();

  const category = CATEGORIES.find((c) => c.slug === product.category);
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    stored,
    histogram,
    relatedItems,
    similar,
  ] = await Promise.all([
    supabase.auth.getUser(),
    listReviews(asin, 20, 0),
    reviewHistogram(asin),
    related(asin, product.category, 14),
    alsoViewed(asin, 12),
  ]);

  // RLS scopes list_items to the viewer, so this only ever finds their row.
  const [onList, myId] = user
    ? await Promise.all([
        supabase
          .from("list_items")
          .select("asin")
          .eq("asin", asin)
          .maybeSingle()
          .then(({ data }) => Boolean(data)),
        myReviewId(supabase, asin),
      ])
    : [false, null];

  const reviews = stored.items.map((r) => ({ ...r, mine: r.id === myId }));
  const alreadyReviewed = myId !== null;
  const off = product.listPriceCents ? percentOff(product.priceCents, product.listPriceCents) : 0;

  const specs: [string, React.ReactNode][] = [
    ["Brand", product.brand],
    [
      "Department",
      <Link key="d" href={`/s?c=${product.category}`} className="link">
        {category?.name}
      </Link>,
    ],
    ["Shipping", product.express ? "HAUL Express · 2 days" : "Standard · 5 days"],
    ["Returns", "30 days, free"],
    ["Item ID", <span key="id" className="font-mono">{product.asin}</span>],
  ];

  return (
    <Container className="pt-6 md:pt-8">
      {/* ---------------------------------------------------- breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 font-mono text-[12px] font-bold uppercase tracking-wider">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/s" className="hover:bg-sun">
              Everything
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/s?c=${product.category}`} className="hover:bg-sun">
              {category?.short}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="clamp-1 max-w-[40ch] text-muted">
            {product.shortTitle}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
        {/* ------------------------------------------------------ gallery */}
        <div className="lg:sticky lg:top-[190px] lg:self-start">
          <Gallery
            images={product.images}
            alt={product.title}
            tint={TINT[product.category]}
            stickers={
              <>
                {off > 0 && (
                  <Sticker tone="pink" className="text-[13px]">
                    -{off}% off
                  </Sticker>
                )}
                {product.badge && (
                  <Sticker tone="sun" tilt={2}>
                    {product.badge}
                  </Sticker>
                )}
              </>
            }
          />
        </div>

        {/* -------------------------------------------------------- info */}
        <div className="min-w-0 space-y-6">
          <div>
            <Link
              href={`/s?q=${encodeURIComponent(product.brand)}`}
              className="inline-block border-2 border-ink bg-card px-2 font-mono text-[12px] font-bold uppercase leading-6 tracking-wider hover:bg-lime"
            >
              {product.brand} · shop the brand →
            </Link>
            <h1 className="mt-3 font-display text-[30px] font-extrabold leading-[1.05] tracking-tight md:text-[40px]">
              {product.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <RatingLine rating={product.rating} count={product.reviewCount} href="#reviews" size={16} />
              {product.boughtPastMonth != null && product.boughtPastMonth >= 50 && (
                <Sticker tone="card" tilt={0}>
                  🔥 {compactCount(product.boughtPastMonth)} bought last month
                </Sticker>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-y-[3px] border-ink py-4">
            <PriceBlock cents={product.priceCents} listCents={product.listPriceCents} size="xl" />
            {product.express && <ExpressBadge className="ml-auto" />}
          </div>

          <VariantPicker variants={product.variants} />

          <div className="space-y-3">
            <BuyBox product={product} />
            <WishlistButton asin={product.asin} signedIn={Boolean(user)} initialSaved={onList} />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ details + specs */}
      <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="border-[3px] border-ink bg-card p-5 shadow-brut md:p-7">
          <h2 className="font-display text-[26px] font-extrabold tracking-tight">Why it&apos;s worth hauling</h2>
          <ul className="mt-4 space-y-3">
            {product.bullets.map((b, i) => (
              <li key={b} className="flex gap-3 text-[15px] leading-relaxed">
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center border-2 border-ink bg-lime font-mono text-[12px] font-bold"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {b}
              </li>
            ))}
          </ul>
        </section>

        <section className="self-start border-[3px] border-ink bg-card shadow-brut">
          <h2 className="border-b-[3px] border-ink bg-ink px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-paper">
            Specs
          </h2>
          <table className="w-full text-[14px]">
            <caption className="sr-only">Product details</caption>
            <tbody>
              {specs.map(([label, value]) => (
                <tr key={label} className="border-b-2 border-ink last:border-b-0">
                  <th scope="row" className="w-[40%] bg-paper px-4 py-3 text-left font-mono text-[12px] font-bold uppercase">
                    {label}
                  </th>
                  <td className="px-4 py-3 font-semibold">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* ------------------------------------------------------- shelves */}
      <div className="mt-16 space-y-16">
        <section>
          <SectionHeading
            index="01"
            title={`More from ${category?.short ?? "this department"}`}
            href={`/s?c=${product.category}`}
          />
          <Shelf products={relatedItems} label={`More from ${category?.short ?? "this department"}`} />
        </section>

        <section>
          <SectionHeading index="02" title="Similar price" />
          <Shelf products={similar} label="Similar price" />
        </section>

        <Reviews
          product={product}
          reviews={reviews}
          histogram={histogram}
          total={stored.total}
          canReview={!alreadyReviewed}
          signedIn={Boolean(user)}
        />
      </div>
    </Container>
  );
}
