import { revalidateTag } from "next/cache";
import { authenticate, noContent, notFound, handler } from "@/lib/api/http";
import { CATALOG_TAG } from "@/lib/catalog";
import { deleteReview } from "@/lib/reviews";

async function handleDELETE(request: Request, { params }: { params: Promise<{ asin: string }> }) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;

  const removed = await deleteReview(auth.db, (await params).asin);
  if (!removed) return notFound("Review");
  revalidateTag(CATALOG_TAG, { expire: 0 });
  return noContent();
}

export const DELETE = handler(handleDELETE);
