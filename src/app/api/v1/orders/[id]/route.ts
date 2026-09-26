import { authenticate, mine, notFound, handler } from "@/lib/api/http";
import { getOrder } from "@/lib/orders";

/** RLS makes another shopper's order indistinguishable from a missing one. */
async function handleGET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;

  const order = await getOrder((await params).id, auth.db);
  return order ? mine(order) : notFound("Order");
}

export const GET = handler(handleGET);
