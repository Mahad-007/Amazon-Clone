import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, related, alsoViewed } from "@/lib/catalog";
import { listReviews, publicReview, reviewHistogram } from "@/lib/reviews";
import { getUser } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/types";
import { Gallery } from "@/components/product/Gallery";
import { VariantPicker } from "@/components/product/VariantPicker";
import { BuyBox } from "@/components/product/BuyBox";
import { Reviews } from "@/components/product/Reviews";
import { Rail } from "@/components/home/Rail";
import { RatingLine } from "@/components/ui/Stars";
import { PriceBlock } from "@/components/ui/Price";
import { PrimeBadge } from "@/components/ui/PrimeBadge";
import { compactCount } from "@/lib/format";
import { WishlistButton } from "@/components/product/WishlistButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ asin: string }>;
}): Promise<Metadata> {
  const { asin } = await params;
  const product = await getProduct(asin);
  if (!product) return { title: "Product not found" };

  return {
    title: product.shortTitle,
    description: product.bullets[0],
    openGraph: {
      title: product.shortTitle,
      images: [product.images[0]],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ asin: string }>;
}) {
  const { asin } = await params;
  const product = await getProduct(asin);
  if (!product) notFound();

  const category = CATEGORIES.find((c) => c.slug === product.category);

  const [user, stored, histogram, relatedItems, similar] = await Promise.all([
    getUser(),
    listReviews(asin, 20, 0),
    reviewHistogram(asin),
    related(asin, product.category, 14),
    alsoViewed(asin, 12),
  ]);

  const reviews = stored.items.map((r) => ({
    ...publicReview(r),
    mine: user ? r.userId === user.id : false,
  }));
  const alreadyReviewed = reviews.some((r) => r.mine);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-3">
      {/* ------------------------------------------------- breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-2 text-[12px] text-[#565959]">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/s" className="link-teal">
              All
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href={`/s?c=${product.category}`} className="link-teal">
              {category?.name}
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="clamp-1 text-[#565959]">{product.shortTitle}</li>
        </ol>
      </nav>

      <div className="bg-white p-4">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)_300px]">
          {/* ------------------------------------------------ gallery */}
          <Gallery images={product.images} alt={product.title} />

          {/* -------------------------------------------- centre column */}
          <div className="min-w-0">
            <h1 className="mb-1 text-[24px] leading-8 text-ink">
              {product.title}
            </h1>

            <Link
              href={`/s?q=${encodeURIComponent(product.brand)}`}
              className="text-[14px] link-teal"
            >
              Visit the {product.brand} Store
            </Link>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 border-b border-line pb-3">
              <RatingLine
                rating={product.rating}
                count={product.reviewCount}
                href="#reviews"
                size={16}
                showRating
              />
            </div>

            {product.boughtPastMonth != null && product.boughtPastMonth >= 50 && (
              <p className="mt-2 text-[14px] text-[#565959]">
                {compactCount(product.boughtPastMonth)} bought in past month
              </p>
            )}

            <div className="mt-3 border-b border-line pb-3">
              <PriceBlock
                cents={product.priceCents}
                listCents={product.listPriceCents}
                size="xl"
              />
              {product.express && (
                <div className="mt-1">
                  <PrimeBadge />
                </div>
              )}
            </div>

            <div className="mt-4">
              <VariantPicker variants={product.variants} />
            </div>

            <table className="mt-5 w-full text-[14px]">
              <caption className="sr-only">Product details</caption>
              <tbody>
                <tr>
                  <th scope="row" className="w-[120px] py-1 text-left font-bold text-ink">
                    Brand
                  </th>
                  <td className="py-1 text-ink">{product.brand}</td>
                </tr>
                <tr className="bg-[#f7f7f7]">
                  <th scope="row" className="py-1 text-left font-bold text-ink">
                    Department
                  </th>
                  <td className="py-1 text-ink">{category?.name}</td>
                </tr>
                <tr>
                  <th scope="row" className="py-1 text-left font-bold text-ink">
                    ASIN
                  </th>
                  <td className="py-1 text-ink">{product.asin}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-5">
              <h2 className="mb-2 text-[16px] font-bold text-ink">
                About this item
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-[14px] leading-5 text-ink">
                {product.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* ------------------------------------------------- buy box */}
          <div className="space-y-3">
            <BuyBox product={product} />
            <WishlistButton asin={product.asin} signedIn={Boolean(user)} />
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- related */}
      <div className="mt-4 space-y-4">
        <Rail
          title="Products related to this item"
          products={relatedItems}
        />
        <Rail
          title="Customers also viewed"
          products={similar}
        />

        <Reviews
          product={product}
          reviews={reviews}
          histogram={histogram}
          total={stored.total}
          canReview={!alreadyReviewed}
          signedIn={Boolean(user)}
        />
      </div>
    </div>
  );
}
