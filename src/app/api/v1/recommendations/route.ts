import { ASIN_RE, intParam, ok, preflight } from "@/lib/api/http";
import { relatedToAny } from "@/lib/catalog";

export const OPTIONS = preflight;

/** "Goes with these": pass the ASINs in a cart, order or list. */
export async function GET(request: Request) {
  const asins = (new URL(request.url).searchParams.get("asins") ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter((a) => ASIN_RE.test(a))
    .slice(0, 50);
  return ok({ items: await relatedToAny(asins, intParam(request.url, "limit", 14, 1, 48)) });
}
