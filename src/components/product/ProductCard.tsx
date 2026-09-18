import Link from "next/link";
import type { Product } from "@/lib/types";
import { PriceBlock } from "@/components/ui/Price";
import { RatingLine } from "@/components/ui/Stars";
import { PrimeBadge } from "@/components/ui/PrimeBadge";
import { compactCount, deliveryDate, formatDelivery } from "@/lib/format";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

/**
 * Images come straight from Amazon's CDN at a rendition we pick in the build
 * script, so they are already correctly sized. We use a plain <img> rather
 * than next/image on purpose: it removes a whole class of deploy-time image
 * optimisation failure from the live demo, and buys nothing here.
 */
export function ProductCard({
  product,
  showDelivery = true,
  showAddToCart = false,
}: {
  product: Product;
  showDelivery?: boolean;
  showAddToCart?: boolean;
}) {
  const href = `/product/${product.asin}`;

  return (
    <div className="group flex h-full flex-col bg-white p-4">
      <Link href={href} className="mb-3 block">
        <div className="flex h-[200px] items-center justify-center">
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="max-h-[200px] max-w-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      {product.badge && (
        <span className="mb-1 w-fit bg-[#cc0c39] px-1.5 py-0.5 text-[11px] font-bold text-white">
          {product.badge}
        </span>
      )}

      <Link href={href} className="mb-1">
        <h3 className="clamp-2 text-[14px] leading-5 link-teal">
          {product.title}
        </h3>
      </Link>

      <div className="mb-1">
        <RatingLine
          rating={product.rating}
          count={product.reviewCount}
          href={`${href}#reviews`}
        />
      </div>

      {product.boughtPastMonth != null && product.boughtPastMonth >= 50 && (
        <p className="mb-1 text-[12px] text-[#565959]">
          {compactCount(product.boughtPastMonth)} bought in past month
        </p>
      )}

      <div className="mb-1">
        <PriceBlock
          cents={product.priceCents}
          listCents={product.listPriceCents}
          size="md"
        />
      </div>

      {product.isPrime && (
        <div className="mb-1">
          <PrimeBadge />
        </div>
      )}

      {showDelivery && (
        <p className="mb-2 text-[12px] text-[#565959]">
          FREE delivery{" "}
          <span className="font-bold text-ink">
            {formatDelivery(deliveryDate(product.isPrime ? 2 : 5))}
          </span>
        </p>
      )}

      {/* Push the CTA to the bottom so cards in a row line up. */}
      <div className="mt-auto pt-2">
        {showAddToCart && <AddToCartButton asin={product.asin} compact />}
      </div>
    </div>
  );
}

/** Dense variant for horizontal rails — image, price, rating only. */
export function RailCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.asin}`}
      className="group block w-[180px] shrink-0"
    >
      <div className="flex h-[180px] items-center justify-center bg-white">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="max-h-[180px] max-w-full object-contain transition-transform duration-200 group-hover:scale-[1.04]"
        />
      </div>
      <p className="clamp-2 mt-2 text-[13px] leading-[18px] link-teal">
        {product.shortTitle}
      </p>
      <div className="mt-1 flex items-center gap-1">
        <RatingLine rating={product.rating} count={product.reviewCount} size={13} />
      </div>
      <div className="mt-1">
        <PriceBlock
          cents={product.priceCents}
          listCents={product.listPriceCents}
          size="sm"
          showPercent={false}
        />
      </div>
    </Link>
  );
}

/** Image-only tile used inside the home page's category cards. */
export function TileCard({
  product,
  label,
}: {
  product: Product;
  label?: string;
}) {
  return (
    <Link href={`/product/${product.asin}`} className="group block">
      <div className="flex h-[110px] items-center justify-center overflow-hidden bg-white">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="max-h-[110px] max-w-full object-contain"
        />
      </div>
      <p className="clamp-1 mt-1.5 text-[12px] text-ink">
        {label ?? product.shortTitle}
      </p>
    </Link>
  );
}
