import { money } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";

/** How far the cart is from free shipping, as a chunky progress bar. */
export const FreeShippingMeter = ({ subtotal }: { subtotal: number }) => {
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const left = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold">
        {left > 0 ? (
          <>
            Add <strong className="bg-sun px-1">{money(left)}</strong> more for free shipping.
          </>
        ) : (
          <>Free shipping unlocked.</>
        )}
      </p>
      <div
        role="progressbar"
        aria-label="Progress toward free shipping"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-4 overflow-hidden rounded-full border-2 border-ink bg-card"
      >
        <div
          className={`h-full bg-lime bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgba(17,17,17,.14)_6px_9px)] ${
            pct > 0 && pct < 100 ? "border-r-2 border-ink" : ""
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
