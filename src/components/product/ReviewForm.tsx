"use client";

import Link from "next/link";
import { useActionState } from "react";
import { postReview } from "@/app/actions/reviews";
import { buttonStyles } from "@/components/ui/Button";
import { FormError, inputStyles } from "@/components/ui/Field";

const STAR = "M12 2.5l2.94 6.28 6.86.74-5.13 4.63 1.43 6.77L12 17.47 5.9 20.92l1.43-6.77L2.2 9.52l6.86-.74z";
const LABELS = ["", "Hated it", "Meh", "It's fine", "Liked it", "Love it"];

// The stars fill up to the checked radio, and the matching word shows, in
// pure CSS (:has), so the picker reads correctly with JavaScript off too.
const STAR_CSS = [
  [1, 2, 3, 4, 5]
    .map((n) => `.review-stars:has(label:nth-of-type(${n}) input:checked) label:nth-of-type(-n+${n}) path`)
    .join(",") + "{fill:var(--color-sun)}",
  ".review-stars .rating-word{display:none}",
  ...[1, 2, 3, 4, 5].map(
    (n) => `.review-stars:has(input[value="${n}"]:checked) .rating-word-${n}{display:inline}`,
  ),
  ".review-stars label:has(input:focus-visible){outline:3px solid var(--color-cobalt);outline-offset:2px}",
].join("");

/**
 * A real form posting to a server action: rating radios, headline and body
 * are named fields, so a review can be written with JavaScript off. With it
 * on, useActionState keeps the page in place and shows the result inline.
 */
export function ReviewForm({
  asin,
  signedIn,
  canReview,
}: {
  asin: string;
  signedIn: boolean;
  canReview: boolean;
}) {
  const [state, action, pending] = useActionState(postReview, { ok: false, error: null });

  if (!signedIn) {
    return (
      <Link href={`/signin?next=/product/${asin}`} className={buttonStyles({ variant: "secondary", block: true })}>
        Sign in to write a review
      </Link>
    );
  }

  if (state.ok || !canReview) {
    return (
      <p className="border-[3px] border-ink bg-lime px-3 py-2.5 text-[14px] font-semibold">
        Thanks, your review has been posted.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="asin" value={asin} />
      <style>{STAR_CSS}</style>
      <fieldset className="review-stars">
        <legend className="mb-1.5 font-mono text-[12px] font-bold uppercase tracking-wider">
          Your rating:{" "}
          {LABELS.slice(1).map((word, i) => (
            <span key={word} className={`rating-word rating-word-${i + 1} text-muted`}>
              {word}
            </span>
          ))}
        </legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer p-0.5 transition-transform hover:scale-110">
              <input
                type="radio"
                name="rating"
                value={n}
                defaultChecked={n === 5}
                className="sr-only"
              />
              <span className="sr-only">
                {n} star{n === 1 ? "" : "s"}
              </span>
              <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
                <path d={STAR} fill="var(--color-card)" stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="sr-only">Review headline</span>
        <input name="title" placeholder="Add a headline" maxLength={120} className={inputStyles} />
      </label>

      <label className="block">
        <span className="sr-only">Review</span>
        <textarea
          name="body"
          placeholder="What did you like or dislike?"
          rows={4}
          maxLength={2000}
          required
          minLength={4}
          className={`${inputStyles} h-auto py-2.5`}
        />
      </label>

      {state.error && <FormError>{state.error}</FormError>}

      <button type="submit" disabled={pending} className={buttonStyles({ block: true })}>
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
