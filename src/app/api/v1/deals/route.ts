import { intParam, ok, preflight } from "@/lib/api/http";
import { deals } from "@/lib/catalog";

export const OPTIONS = preflight;

export async function GET(request: Request) {
  return ok({ items: await deals(intParam(request.url, "limit", 24, 1, 60)) });
}
