import Link from "next/link";
import type { Product } from "@/lib/types";
import { PriceBlock } from "@/components/ui/Price";
import { RatingLine } from "@/components/ui/Stars";
import { PrimeBadge } from "@/components/ui/PrimeBadge";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { compactCount, deliveryDate, formatDelivery } from "@/lib/format";

/**
 * Amazon's search result is a horizontal row, not a grid tile: big image on
 * the left, a dense stack of signals on the right. The extra width is what
 * lets it show the full title, the bought-in-past-month line and delivery
 * dates all at once.
 */
export function SearchResultCard({ product }: { product: Product }) {
  const href = `/product/${product.asin}`;
  const arrives = deliveryDate(product.isPrime ? 2 : 5);

  return (
    <article className="flex flex-col gap-4 border-b border-line bg-white p-4 last:border-b-0 sm:flex-row">
      <Link
        href={href}
        className="flex h-[200px] w-full shrink-0 items-center justify-center sm:w-[220px]"
      >
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="max-h-[200px] max-w-full object-contain"
        />
      </Link>

      <div className="min-w-0 flex-1">
        {product.badge && (
          <span className="mb-1 inline-block bg-[#cc0c39] px-1.5 py-0.5 text-[11px] font-bold text-white">
            {product.badge}
          </span>
        )}

        <Link href={href}>
          <h2 className="clamp-2 text-[18px] leading-6 link-teal">
            {product.title}
          </h2>
        </Link>

        <p className="mt-0.5 text-[14px] text-[#565959]">
          Brand:{" "}
          <Link href={`/s?q=${encodeURIComponent(product.brand)}`} className="link-teal">
            {product.brand}
          </Link>
        </p>

        <div className="mt-1">
          <RatingLine
            rating={product.rating}
            count={product.reviewCount}
            href={`${href}#reviews`}
            showRating
          />
        </div>

        {product.boughtPastMonth != null && product.boughtPastMonth >= 50 && (
          <p className="mt-0.5 text-[13px] text-[#565959]">
            {compactCount(product.boughtPastMonth)} bought in past month
          </p>
        )}

        <div className="mt-1.5">
          <PriceBlock
            cents={product.priceCents}
            listCents={product.listPriceCents}
            size="lg"
          />
        </div>

        {product.isPrime && (
          <div className="mt-1">
            <PrimeBadge />
          </div>
        )}

        <p className="mt-1 text-[13px] text-[#565959]">
          FREE delivery{" "}
          <span className="font-bold text-ink">{formatDelivery(arrives)}</span>
        </p>

        {product.stock <= 8 && (
          <p className="mt-1 text-[13px] text-price">
            Only {product.stock} left in stock — order soon.
          </p>
        )}

        <div className="mt-3 max-w-[220px]">
          <AddToCartButton asin={product.asin} />
        </div>
      </div>
    </article>
  );
}
