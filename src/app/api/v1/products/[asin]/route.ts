import { notFound, ok, preflight } from "@/lib/api/http";
import { getProduct } from "@/lib/catalog";

export const OPTIONS = preflight;

export async function GET(_request: Request, { params }: { params: Promise<{ asin: string }> }) {
  const product = await getProduct((await params).asin);
  return product ? ok(product) : notFound("Product");
}
