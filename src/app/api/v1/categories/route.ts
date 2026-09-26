import { ok, preflight } from "@/lib/api/http";
import { listCategories } from "@/lib/catalog";

export const OPTIONS = preflight;

export async function GET() {
  return ok({ items: await listCategories() });
}
