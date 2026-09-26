import { ok, preflight } from "@/lib/api/http";
import { suggestions } from "@/lib/catalog";

export const OPTIONS = preflight;

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 80);
  return ok({ suggestions: await suggestions(q) });
}
