import { authenticate, mine, handler } from "@/lib/api/http";
import { cartView } from "@/lib/api/cart-view";

/** The signed-in cart. Guest carts live in a browser cookie and aren't exposed. */
async function handleGET(request: Request) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;
  return mine(await cartView(auth.db));
}

export const GET = handler(handleGET);
