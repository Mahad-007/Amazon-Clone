import Link from "next/link";
import type { Product } from "@/lib/types";
import { TINT } from "@/lib/tint";
import { percentOff } from "@/lib/format";
import { PriceBlock } from "@/components/ui/Price";
import { RatingLine } from "@/components/ui/Stars";
import { ExpressBadge } from "@/components/ui/ExpressBadge";
import { Sticker } from "@/components/ui/Sticker";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

/**
 * The product tile used in every grid and shelf.
 *
 * Images are served by the source CDN at a size picked in the build script,
 * so a plain <img> is deliberate: next/image would add an optimisation step
 * that buys nothing here and is one more thing to fail at deploy time.
 */
export function ProductCard({
  product,
  showAddToCart = false,
  priority = false,
}: {
  product: Product;
  showAddToCart?: boolean;
  priority?: boolean;
}) {
  const href = `/product/${product.asin}`;
  const off = product.listPriceCents ? percentOff(product.priceCents, product.listPriceCents) : 0;

  return (
    <article className="group relative flex h-full flex-col border-[3px] border-ink bg-card shadow-brut lift">
      <Link href={href} className={`relative block border-b-[3px] border-ink ${TINT[product.category]}`}>
        <div className="flex aspect-square items-center justify-center p-5">
          <img
            src={product.image}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-[1.04]"
          />
        </div>
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {off > 0 && <Sticker tone="pink">-{off}%</Sticker>}
          {product.badge && (
            <Sticker tone="sun" tilt={2}>
              {product.badge}
            </Sticker>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">{product.brand}</p>
        <h3 className="clamp-2 text-[15px] font-semibold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] hover:underline">
            {product.shortTitle}
          </Link>
        </h3>
        <RatingLine rating={product.rating} count={product.reviewCount} size={13} />
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <PriceBlock cents={product.priceCents} listCents={product.listPriceCents} size="md" showPercent={false} />
          {product.express && <ExpressBadge />}
        </div>
        {showAddToCart && (
          // Above the stretched title link, so the button stays clickable.
          <div className="relative z-10 pt-1">
            <AddToCartButton asin={product.asin} compact />
          </div>
        )}
      </div>
    </article>
  );
}
