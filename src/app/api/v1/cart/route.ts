import { authenticate, mine } from "@/lib/api/http";
import { cartView } from "@/lib/api/cart-view";

/** The signed-in cart. Guest carts live in a browser cookie and aren't exposed. */
export async function GET(request: Request) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;
  return mine(await cartView(auth.db));
}
