import Link from "next/link";
import { reviewCount as fmtCount } from "@/lib/format";

const STAR = "M12 2.5l2.94 6.28 6.86.74-5.13 4.63 1.43 6.77L12 17.47 5.9 20.92l1.43-6.77L2.2 9.52l6.86-.74z";

/**
 * Five outlined stars with a sun fill clipped to the rating, so half stars
 * are exact. One accessible name for the whole row.
 */
export const Stars = ({
  rating,
  size = 14,
  className = "",
}: {
  rating: number;
  size?: number;
  className?: string;
}) => {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const row = (fill: string) => (
    <span className="absolute inset-0 flex gap-[2px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
          <path d={STAR} fill={fill} stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
  return (
    <span
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
      className={`relative inline-block shrink-0 align-middle ${className}`}
      style={{ width: size * 5 + 8, height: size }}
    >
      {row("var(--color-card)")}
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        {row("var(--color-sun)")}
      </span>
    </span>
  );
};

/** Rating number, stars and review count, optionally linking to the reviews. */
export const RatingLine = ({
  rating,
  count,
  href,
  size = 14,
  showRating = true,
}: {
  rating: number;
  count: number;
  href?: string;
  size?: number;
  showRating?: boolean;
}) => {
  const inner = (
    <>
      {showRating && <span className="font-mono text-[13px] font-bold">{rating.toFixed(1)}</span>}
      <Stars rating={rating} size={size} />
      <span className="font-mono text-[12px] text-muted">({fmtCount(count)})</span>
    </>
  );
  if (!href) return <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">{inner}</span>;
  return (
    <Link href={href} className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 hover:underline">
      {inner}
    </Link>
  );
};
