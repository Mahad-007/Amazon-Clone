"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { setWishlist } from "@/app/actions/wishlist";
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

const style = buttonStyles({ variant: "secondary", size: "md", block: true });

/** While the post is in flight, show the state being asked for. */
function Submit({ saved }: { saved: boolean }) {
  const { pending, data } = useFormStatus();
  const shown = pending && data ? data.get("save") === "1" : saved;
  return (
    <button type="submit" disabled={pending} aria-pressed={shown} className={style}>
      <Heart filled={shown} /> {shown ? "Saved to wish list" : "Save to wish list"}
    </button>
  );
}

/**
 * A real form posting to a server action, so it works without JavaScript.
 * `initialSaved` comes from the server and is refreshed by the action's
 * revalidation, so there is no client state to drift out of sync.
 */
export function WishlistButton({
  asin,
  signedIn,
  initialSaved = false,
}: {
  asin: string;
  signedIn: boolean;
  initialSaved?: boolean;
}) {
  if (!signedIn) {
    return (
      <Link href={`/signin?next=/product/${asin}`} className={style}>
        <Heart filled={false} /> Save to wish list
      </Link>
    );
  }

  return (
    <form action={setWishlist}>
      <input type="hidden" name="asin" value={asin} />
      <input type="hidden" name="save" value={initialSaved ? "0" : "1"} />
      <Submit saved={initialSaved} />
    </form>
  );
}
