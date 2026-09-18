import Link from "next/link";
import { reviewCount as fmtCount } from "@/lib/format";

/**
 * Amazon's star row: a solid gold bar clipped to the rating percentage over
 * a grey outline row. Clipping one gradient beats rendering five partial
 * glyphs and gets half-stars exactly right.
 */
export function Stars({
  rating,
  size = 14,
  className = "",
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));

  return (
    <span
      className={`relative inline-block shrink-0 align-middle ${className}`}
      style={{ width: size * 5 + 4, height: size }}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      <StarRow size={size} className="text-[#d5d9d9]" />
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pct}%` }}
      >
        <StarRow size={size} className="text-[#ffa41c]" />
      </span>
    </span>
  );
}

function StarRow({ size, className }: { size: number; className: string }) {
  return (
    <span className={`absolute inset-0 flex gap-[1px] ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="shrink-0"
        >
          <path d="M12 17.27 5.82 21l1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73L18.18 21z" />
        </svg>
      ))}
    </span>
  );
}

/** Star row + linked review count, the pairing used on cards and the PDP. */
export function RatingLine({
  rating,
  count,
  href,
  size = 14,
  showRating = false,
}: {
  rating: number;
  count: number;
  href?: string;
  size?: number;
  showRating?: boolean;
}) {
  const inner = (
    <>
      {showRating && (
        <span className="text-[14px] text-ink">{rating.toFixed(1)}</span>
      )}
      <Stars rating={rating} size={size} />
      <span className="text-[13px] link-teal">{fmtCount(count)}</span>
    </>
  );

  if (!href) {
    return <span className="flex items-center gap-1.5">{inner}</span>;
  }

  return (
    <Link href={href} className="flex items-center gap-1.5 group">
      {inner}
    </Link>
  );
}
