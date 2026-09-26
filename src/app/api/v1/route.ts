import { ok, handler } from "@/lib/api/http";

/** Index of the HAUL REST API. Human-readable docs live at /api. */
function handleGET() {
  return ok({
    name: "HAUL API",
    version: "v1",
    docs: "/api",
    auth: "Send `Authorization: Bearer <Supabase access token>`, or call from a signed-in browser session.",
    endpoints: [
      "GET    /api/v1/health",
      "GET    /api/v1/categories",
      "GET    /api/v1/products?q=&c=&brand=&min=&max=&rating=&express=&deals=&sort=&page=&pageSize=",
      "GET    /api/v1/facets?(same filters)",
      "GET    /api/v1/products/{asin}",
      "GET    /api/v1/products/{asin}/related?kind=category|price&limit=",
      "GET    /api/v1/products/{asin}/reviews?limit=&offset=",
      "POST   /api/v1/products/{asin}/reviews            (auth)",
      "DELETE /api/v1/products/{asin}/reviews/mine       (auth)",
      "GET    /api/v1/deals?limit=",
      "GET    /api/v1/recommendations?asins=A,B&limit=",
      "GET    /api/v1/suggest?q=",
      "GET    /api/v1/cart                               (auth)",
      "POST   /api/v1/cart/items                         (auth)",
      "PATCH  /api/v1/cart/items/{asin}                  (auth)",
      "DELETE /api/v1/cart/items/{asin}                  (auth)",
      "GET    /api/v1/wishlist                           (auth)",
      "PUT    /api/v1/wishlist/{asin}                    (auth)",
      "DELETE /api/v1/wishlist/{asin}                    (auth)",
      "GET    /api/v1/orders                             (auth)",
      "POST   /api/v1/orders                             (auth)",
      "GET    /api/v1/orders/{id}                        (auth)",
    ],
  });
}

export const GET = handler(handleGET);
