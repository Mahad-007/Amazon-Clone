"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { submitReview } from "@/app/actions/reviews";

export function ReviewForm({
  asin,
  signedIn,
  canReview,
}: {
  asin: string;
  signedIn: boolean;
  canReview: boolean;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link
        href={`/signin?next=/product/${asin}`}
        className="block rounded-full border border-line bg-white py-1.5 text-center text-[13px] text-ink hover:bg-[#f7fafa]"
      >
        Sign in to write a review
      </Link>
    );
  }

  if (done || !canReview) {
    return (
      <p className="text-[13px] text-success">
        Thanks — your review has been posted.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await submitReview({ asin, rating, title, body });
          if (result.ok) setDone(true);
          else setError(result.error);
        });
      }}
      className="space-y-2"
    >
      <fieldset>
        <legend className="sr-only">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              aria-pressed={rating === n}
              className="p-0.5"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-6 w-6 ${n <= rating ? "text-[#ffa41c]" : "text-[#d5d9d9]"}`}
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M12 17.27 5.82 21l1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73L18.18 21z"
                />
              </svg>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="sr-only">Review headline</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a headline"
          maxLength={120}
          className="w-full rounded border border-line px-2 py-1.5 text-[13px]"
        />
      </label>

      <label className="block">
        <span className="sr-only">Review body</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you like or dislike?"
          rows={3}
          maxLength={2000}
          className="w-full rounded border border-line px-2 py-1.5 text-[13px]"
        />
      </label>

      {error && <p className="text-[13px] text-price">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-cta py-1.5 text-[13px] text-ink hover:bg-cta-hover disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
