import { ok, preflight, handler } from "@/lib/api/http";
import { suggestions } from "@/lib/catalog";

export const OPTIONS = preflight;

async function handleGET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 80);
  return ok({ suggestions: await suggestions(q) });
}

export const GET = handler(handleGET);
