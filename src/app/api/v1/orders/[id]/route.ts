import { authenticate, mine, notFound } from "@/lib/api/http";
import { getOrder } from "@/lib/orders";

/** RLS makes another shopper's order indistinguishable from a missing one. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;

  const order = await getOrder((await params).id, auth.db);
  return order ? mine(order) : notFound("Order");
}
