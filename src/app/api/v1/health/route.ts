import { connection } from "next/server";
import { fail, mine } from "@/lib/api/http";
import { publicDb } from "@/lib/supabase/public";

/** Liveness plus a real round trip to Postgres; deliberately uncached. */
export async function GET() {
  await connection();
  const started = Date.now();
  const { count, error } = await publicDb()
    .from("products")
    .select("asin", { count: "exact", head: true });
  if (error) return fail(503, "db_unavailable", error.message);
  return mine({ ok: true, products: count, dbLatencyMs: Date.now() - started });
}
