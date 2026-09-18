import { percentOff, splitPrice } from "@/lib/format";

/**
 * Amazon renders price as a small superscript "$", a large whole part and a
 * small superscript cents part. Reproducing that exactly is most of why the
 * grid reads as Amazon rather than as a generic shop.
 */
export function Price({
  cents,
  size = "md",
  className = "",
}: {
  cents: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const { symbol, whole, fraction } = splitPrice(cents);

  const scale = {
    sm: { whole: "text-[16px]", sup: "text-[10px]", top: "top-[1px]" },
    md: { whole: "text-[21px]", sup: "text-[12px]", top: "top-[2px]" },
    lg: { whole: "text-[28px]", sup: "text-[13px]", top: "top-[4px]" },
    xl: { whole: "text-[34px]", sup: "text-[15px]", top: "top-[6px]" },
  }[size];

  return (
    <span className={`inline-flex items-start text-ink ${className}`}>
      <span className={`relative ${scale.sup} ${scale.top}`}>{symbol}</span>
      <span className={`${scale.whole} leading-none tracking-tight`}>
        {whole}
      </span>
      <span className={`relative ${scale.sup} ${scale.top}`}>{fraction}</span>
    </span>
  );
}

/** Price with the struck-through list price and a "N% off" flag. */
export function PriceBlock({
  cents,
  listCents,
  size = "md",
  showPercent = true,
}: {
  cents: number;
  listCents: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  showPercent?: boolean;
}) {
  const off = listCents ? percentOff(cents, listCents) : 0;

  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      {off > 0 && showPercent && (
        <span className="text-[16px] text-price">-{off}%</span>
      )}
      <Price cents={cents} size={size} />
      {listCents != null && off > 0 && (
        <span className="text-[12px] text-[#565959]">
          List:{" "}
          <span className="line-through">
            ${(listCents / 100).toFixed(2)}
          </span>
        </span>
      )}
    </span>
  );
}
