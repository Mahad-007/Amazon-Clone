import { ok, preflight, rawParams, handler } from "@/lib/api/http";
import { searchFacets } from "@/lib/catalog";
import { parseParams } from "@/lib/search-params";

export const OPTIONS = preflight;

/** Filter counts; each dimension is counted ignoring its own selection. */
async function handleGET(request: Request) {
  return ok(await searchFacets(parseParams(rawParams(request.url))));
}

export const GET = handler(handleGET);
