import { money, percentOff, splitPrice } from "@/lib/format";

const SIZES = {
  sm: { whole: "text-[18px]", cents: "text-[11px]" },
  md: { whole: "text-[24px]", cents: "text-[13px]" },
  lg: { whole: "text-[34px]", cents: "text-[16px]" },
  xl: { whole: "text-[48px]", cents: "text-[20px]" },
} as const;

/** Big display-weight dollars with raised cents. */
export const Price = ({
  cents,
  size = "md",
  className = "",
}: {
  cents: number;
  size?: keyof typeof SIZES;
  className?: string;
}) => {
  const { whole, fraction } = splitPrice(cents);
  const s = SIZES[size];
  return (
    <span className={`inline-flex items-start font-display font-extrabold leading-none tracking-tight text-ink ${className}`}>
      <span className="sr-only">{money(cents)}</span>
      <span aria-hidden="true" className={`${s.cents} mt-[0.15em]`}>$</span>
      <span aria-hidden="true" className={s.whole}>{whole}</span>
      <span aria-hidden="true" className={`${s.cents} mt-[0.15em]`}>.{fraction}</span>
    </span>
  );
};

/** Price, struck-through list price and a pink percent-off tag. */
export const PriceBlock = ({
  cents,
  listCents,
  size = "md",
  showPercent = true,
}: {
  cents: number;
  listCents: number | null;
  size?: keyof typeof SIZES;
  showPercent?: boolean;
}) => {
  const off = listCents ? percentOff(cents, listCents) : 0;
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <Price cents={cents} size={size} />
      {listCents != null && off > 0 && (
        <span className="font-mono text-[12px] text-muted">
          <span className="sr-only">List price </span>
          <span className="line-through decoration-2">{money(listCents)}</span>
        </span>
      )}
      {off > 0 && showPercent && (
        <span className="border-2 border-ink bg-pink px-1.5 font-mono text-[12px] font-bold leading-5 text-ink">
          -{off}%
        </span>
      )}
    </span>
  );
};
