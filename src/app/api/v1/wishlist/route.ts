import { authenticate, fail, mine } from "@/lib/api/http";
import { getProducts } from "@/lib/catalog";

export async function GET(request: Request) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.db
    .from("list_items")
    .select("asin")
    .order("added_at", { ascending: false });
  if (error) return fail(500, "db_error", error.message);
  return mine({ items: await getProducts((data ?? []).map((r) => r.asin)) });
}
