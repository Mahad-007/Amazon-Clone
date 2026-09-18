import Link from "next/link";
import type { Product } from "@/lib/types";
import { TileCard } from "@/components/product/ProductCard";

/**
 * The white cards that overlap the hero. Amazon uses two shapes: a 2x2 grid
 * of labelled tiles, or one large image with a link beneath.
 */
export function CategoryCard({
  title,
  href,
  products,
  linkLabel = "See more",
}: {
  title: string;
  href: string;
  products: Product[];
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col bg-white p-5">
      <h2 className="mb-3 text-[21px] font-bold leading-tight text-ink">
        {title}
      </h2>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {products.slice(0, 4).map((p) => (
          <TileCard key={p.asin} product={p} />
        ))}
      </div>

      <Link href={href} className="mt-auto pt-3 text-[13px] link-teal">
        {linkLabel}
      </Link>
    </div>
  );
}

/** Single-image variant, used for the wider feature cards. */
export function FeatureCard({
  title,
  href,
  product,
  linkLabel = "Shop now",
}: {
  title: string;
  href: string;
  product: Product;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col bg-white p-5">
      <h2 className="mb-3 text-[21px] font-bold leading-tight text-ink">
        {title}
      </h2>

      <Link href={`/product/${product.asin}`} className="block grow">
        <div className="flex h-[240px] items-center justify-center overflow-hidden bg-white">
          <img
            src={product.images[0]}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="max-h-[240px] max-w-full object-contain"
          />
        </div>
      </Link>

      <Link href={href} className="mt-auto pt-3 text-[13px] link-teal">
        {linkLabel}
      </Link>
    </div>
  );
}
