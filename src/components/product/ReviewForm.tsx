"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { submitReview } from "@/app/actions/reviews";
import { buttonStyles } from "@/components/ui/Button";
import { FormError, inputStyles } from "@/components/ui/Field";

const STAR = "M12 2.5l2.94 6.28 6.86.74-5.13 4.63 1.43 6.77L12 17.47 5.9 20.92l1.43-6.77L2.2 9.52l6.86-.74z";
const LABELS = ["", "Hated it", "Meh", "It's fine", "Liked it", "Love it"];

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
      <Link href={`/signin?next=/product/${asin}`} className={buttonStyles({ variant: "secondary", block: true })}>
        Sign in to write a review
      </Link>
    );
  }

  if (done || !canReview) {
    return (
      <p className="border-[3px] border-ink bg-lime px-3 py-2.5 text-[14px] font-semibold">
        Thanks, your review has been posted.
      </p>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitReview({ asin, rating, title, body });
      if (result.ok) setDone(true);
      else setError(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <fieldset>
        <legend className="mb-1.5 font-mono text-[12px] font-bold uppercase tracking-wider">
          Your rating: <span className="text-muted">{LABELS[rating]}</span>
        </legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              aria-pressed={rating === n}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
                <path
                  d={STAR}
                  fill={n <= rating ? "var(--color-sun)" : "var(--color-card)"}
                  stroke="var(--color-ink)"
                  strokeWidth="2"
                  strokeLinejoin="round"
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
          className={inputStyles}
        />
      </label>

      <label className="block">
        <span className="sr-only">Review</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you like or dislike?"
          rows={4}
          maxLength={2000}
          className={`${inputStyles} h-auto py-2.5`}
        />
      </label>

      {error && <FormError>{error}</FormError>}

      <button type="submit" disabled={pending} className={buttonStyles({ block: true })}>
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
