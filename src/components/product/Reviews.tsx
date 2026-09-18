import { Stars } from "@/components/ui/Stars";
import { histogram, helpfulCount } from "@/lib/reviews";
import { formatDay, reviewCount as fmtCount } from "@/lib/format";
import type { Product, Review } from "@/lib/types";
import { ReviewForm } from "./ReviewForm";

export function Reviews({
  product,
  reviews,
  canReview,
  signedIn,
}: {
  product: Product;
  reviews: Review[];
  canReview: boolean;
  signedIn: boolean;
}) {
  const dist = histogram(product.rating, product.reviewCount);

  return (
    <section id="reviews" className="scroll-mt-24 bg-white px-5 py-6">
      <h2 className="mb-4 text-[21px] font-bold text-ink">
        Customer reviews
      </h2>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* -------------------------------------------- score + histogram */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Stars rating={product.rating} size={18} />
            <span className="text-[16px] text-ink">
              {product.rating.toFixed(1)} out of 5
            </span>
          </div>
          <p className="mb-4 text-[14px] text-[#565959]">
            {fmtCount(product.reviewCount)} global ratings
          </p>

          <table className="w-full">
            <caption className="sr-only">Rating breakdown</caption>
            <tbody>
              {dist.map((row) => (
                <tr key={row.stars}>
                  <th scope="row" className="py-0.5 pr-2 text-left text-[14px] font-normal link-teal">
                    {row.stars} star
                  </th>
                  <td className="w-full py-0.5">
                    <span className="block h-[22px] overflow-hidden rounded-sm border border-[#d5d9d9] bg-[#f0f2f2]">
                      <span
                        className="block h-full bg-[#ffa41c]"
                        style={{ width: `${row.percent}%` }}
                      />
                    </span>
                  </td>
                  <td className="py-0.5 pl-2 text-right text-[14px] link-teal">
                    {row.percent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-5 border-t border-line pt-4">
            <h3 className="mb-1.5 text-[16px] font-bold text-ink">
              Review this product
            </h3>
            <p className="mb-3 text-[13px] text-[#565959]">
              Share your thoughts with other customers.
            </p>
            <ReviewForm
              asin={product.asin}
              signedIn={signedIn}
              canReview={canReview}
            />
          </div>
        </div>

        {/* ---------------------------------------------------- the list */}
        <div>
          <h3 className="mb-3 text-[17px] font-bold text-ink">
            Top reviews from the United States
          </h3>

          <ul className="space-y-6">
            {reviews.map((r) => (
              <li key={r.id}>
                <div className="mb-1 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d5d9d9] text-[13px] font-bold text-[#565959]"
                  >
                    {r.authorName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="text-[13px] text-ink">{r.authorName}</span>
                  {r.mine && (
                    <span className="rounded bg-[#e3f2f4] px-1.5 py-0.5 text-[11px] text-[#007185]">
                      Your review
                    </span>
                  )}
                </div>

                <div className="mb-1 flex items-center gap-2">
                  <Stars rating={r.rating} size={14} />
                  <span className="text-[14px] font-bold text-ink">
                    {r.title}
                  </span>
                </div>

                <p className="mb-1 text-[13px] text-[#565959]">
                  Reviewed in the United States on {formatDay(r.createdAt)}
                </p>

                <p className="mb-1.5 text-[13px] font-bold text-[#c45500]">
                  Verified Purchase
                </p>

                <p className="text-[14px] leading-[21px] text-ink">{r.body}</p>

                <p className="mt-2 text-[13px] text-[#565959]">
                  {helpfulCount(r.id)} people found this helpful
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
