import { authenticate, fail, mine, handler } from "@/lib/api/http";
import { getProducts } from "@/lib/catalog";

async function handleGET(request: Request) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.db
    .from("list_items")
    .select("asin")
    .order("added_at", { ascending: false });
  if (error) return fail(500, "db_error", error.message);
  return mine({ items: await getProducts((data ?? []).map((r) => r.asin)) });
}

export const GET = handler(handleGET);
