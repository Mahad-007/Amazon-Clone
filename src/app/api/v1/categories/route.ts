import { ok, preflight, handler } from "@/lib/api/http";
import { listCategories } from "@/lib/catalog";

export const OPTIONS = preflight;

async function handleGET() {
  return ok({ items: await listCategories() });
}

export const GET = handler(handleGET);
