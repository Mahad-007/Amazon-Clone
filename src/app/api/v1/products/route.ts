import { intParam, ok, preflight, rawParams } from "@/lib/api/http";
import { searchProducts } from "@/lib/catalog";
import { parseParams } from "@/lib/search-params";

export const OPTIONS = preflight;

/** Search and browse. Accepts exactly the query string the /s page uses. */
export async function GET(request: Request) {
  const params = parseParams(rawParams(request.url));
  const pageSize = intParam(request.url, "pageSize", 16, 1, 48);
  return ok(await searchProducts({ ...params, pageSize }));
}
