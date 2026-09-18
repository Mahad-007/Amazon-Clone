"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleWishlist } from "@/app/actions/wishlist";

export function WishlistButton({
  asin,
  signedIn,
}: {
  asin: string;
  signedIn: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (!signedIn) {
    return (
      <Link
        href={`/signin?next=/product/${asin}`}
        className="block rounded-lg border border-line bg-white py-2 text-center text-[13px] text-ink hover:bg-[#f7fafa]"
      >
        Add to List
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const next = await toggleWishlist(asin);
          setSaved(next);
        })
      }
      className="w-full rounded-lg border border-line bg-white py-2 text-[13px] text-ink hover:bg-[#f7fafa] disabled:opacity-60"
    >
      {saved ? "✓ Added to List" : "Add to List"}
    </button>
  );
}
