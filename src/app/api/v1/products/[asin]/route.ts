import { notFound, ok, preflight, handler } from "@/lib/api/http";
import { getProduct } from "@/lib/catalog";

export const OPTIONS = preflight;

async function handleGET(_request: Request, { params }: { params: Promise<{ asin: string }> }) {
  const product = await getProduct((await params).asin);
  return product ? ok(product) : notFound("Product");
}

export const GET = handler(handleGET);
