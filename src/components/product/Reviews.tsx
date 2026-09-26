import { Stars } from "@/components/ui/Stars";
import { Sticker } from "@/components/ui/Sticker";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatDay, reviewCount as fmtCount } from "@/lib/format";
import type { Histogram, Product, Review } from "@/lib/types";
import { ReviewForm } from "./ReviewForm";

/**
 * Ratings and reviews. The headline number is the product's blended rating
 * (the source listing's ratings plus every HAUL review, computed in SQL).
 * The breakdown and the list are HAUL reviews only: real rows, nothing
 * generated, so a product nobody has reviewed here says so.
 */
export function Reviews({
  product,
  reviews,
  histogram,
  total,
  canReview,
  signedIn,
}: {
  product: Product;
  reviews: Review[];
  /** Distribution of real HAUL reviews only. */
  histogram: Histogram;
  total: number;
  canReview: boolean;
  signedIn: boolean;
}) {
  const haul = product.haulReviewCount;

  return (
    <section id="reviews" className="scroll-mt-40">
      <SectionHeading index="03" title="Reviews" />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          {/* --------------------------------------------------- summary */}
          <div className="border-[3px] border-ink bg-sun p-5 shadow-brut">
            <p className="font-mono text-[12px] font-bold uppercase tracking-wider">Overall rating</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="font-display text-[72px] font-extrabold leading-[0.85] tracking-tight">
                {product.rating.toFixed(1)}
              </span>
              <span className="pb-1">
                <Stars rating={product.rating} size={20} />
                <span className="mt-1 block font-mono text-[12px]">{fmtCount(product.reviewCount)} ratings</span>
              </span>
            </div>
            <p className="mt-3 border-t-2 border-ink pt-2 text-[12px] leading-snug">
              Blends the source listing&apos;s ratings with {haul} HAUL review{haul === 1 ? "" : "s"}. Every review
              written here moves this number.
            </p>
          </div>

          {/* ---------------------------------------------- breakdown */}
          <div className="border-[3px] border-ink bg-card p-5 shadow-brut">
            <h3 className="font-mono text-[12px] font-bold uppercase tracking-wider">
              HAUL reviews · {total}
            </h3>
            <table className="mt-3 w-full">
              <caption className="sr-only">Breakdown of HAUL reviews by star rating</caption>
              <tbody>
                {histogram.map((row) => (
                  <tr key={row.stars}>
                    <th scope="row" className="w-14 py-1 pr-2 text-left font-mono text-[13px] font-bold">
                      {row.stars} ★
                    </th>
                    <td className="py-1">
                      <span className="block h-5 border-2 border-ink bg-paper">
                        <span className="block h-full bg-sun" style={{ width: `${row.pct}%` }} />
                      </span>
                    </td>
                    <td className="w-12 py-1 pl-2 text-right font-mono text-[12px]">{row.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---------------------------------------------------- write */}
          <div className="border-[3px] border-ink bg-card p-5 shadow-brut">
            <h3 className="mb-3 font-display text-[22px] font-extrabold">Write a review</h3>
            <ReviewForm asin={product.asin} signedIn={signedIn} canReview={canReview} />
          </div>
        </div>

        {/* -------------------------------------------------------- list */}
        <div>
          {reviews.length === 0 ? (
            <div className="grid min-h-[240px] place-items-center border-[3px] border-dashed border-ink bg-paper-deep p-8 text-center">
              <div>
                <p className="font-display text-[26px] font-extrabold">No HAUL reviews yet — be the first</p>
                <p className="mt-2 text-[15px] text-muted">
                  Reviews here are written by people who shop HAUL. Nothing is generated.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="border-[3px] border-ink bg-card p-5 shadow-brut">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-lime font-display text-[17px] font-extrabold"
                    >
                      {r.authorName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="font-semibold">{r.authorName}</span>
                    {r.mine && (
                      <Sticker tone="lime" tilt={-2}>
                        Your review
                      </Sticker>
                    )}
                    <span className="ml-auto font-mono text-[12px] text-muted">{formatDay(r.createdAt)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Stars rating={r.rating} size={16} />
                    <h4 className="font-display text-[18px] font-bold">{r.title}</h4>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
