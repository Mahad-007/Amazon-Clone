import { authenticate, fail, noContent, notFound, handler } from "@/lib/api/http";
import { getProduct } from "@/lib/catalog";

type Ctx = { params: Promise<{ asin: string }> };

/** Idempotent add. */
async function handlePUT(request: Request, { params }: Ctx) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;

  const product = await getProduct((await params).asin);
  if (!product) return notFound("Product");

  const { error } = await auth.db
    .from("list_items")
    .upsert({ user_id: auth.user.id, asin: product.asin }, { onConflict: "user_id,asin", ignoreDuplicates: true });
  if (error) return fail(500, "db_error", error.message);
  return noContent();
}

/** Idempotent remove. */
async function handleDELETE(request: Request, { params }: Ctx) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;

  const { error } = await auth.db.from("list_items").delete().eq("asin", (await params).asin);
  if (error) return fail(500, "db_error", error.message);
  return noContent();
}

export const PUT = handler(handlePUT);
export const DELETE = handler(handleDELETE);
