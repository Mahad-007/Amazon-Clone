"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleWishlist } from "@/app/actions/wishlist";
import { buttonStyles } from "@/components/ui/Button";

const Heart = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z"
      fill={filled ? "var(--color-pink)" : "none"}
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
  </svg>
);

export function WishlistButton({
  asin,
  signedIn,
  initialSaved = false,
}: {
  asin: string;
  signedIn: boolean;
  initialSaved?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(initialSaved);
  const style = buttonStyles({ variant: "secondary", size: "md", block: true });

  if (!signedIn) {
    return (
      <Link href={`/signin?next=/product/${asin}`} className={style}>
        <Heart filled={false} /> Save to wish list
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={saved}
      onClick={() =>
        startTransition(async () => {
          setSaved(await toggleWishlist(asin));
        })
      }
      className={style}
    >
      <Heart filled={saved} /> {saved ? "Saved to wish list" : "Save to wish list"}
    </button>
  );
}
