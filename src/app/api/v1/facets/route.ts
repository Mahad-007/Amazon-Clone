import { ok, preflight, rawParams } from "@/lib/api/http";
import { searchFacets } from "@/lib/catalog";
import { parseParams } from "@/lib/search-params";

export const OPTIONS = preflight;

/** Filter counts; each dimension is counted ignoring its own selection. */
export async function GET(request: Request) {
  return ok(await searchFacets(parseParams(rawParams(request.url))));
}
