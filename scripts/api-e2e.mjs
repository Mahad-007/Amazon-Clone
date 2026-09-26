/**
 * End-to-end test of the /api/v1 REST API against a running app and its real
 * Postgres. Nothing is mocked: it signs up two throwaway shoppers through
 * Supabase Auth, then drives the catalogue, cart, wish list, reviews and
 * checkout over HTTP with their bearer tokens.
 *
 *   BASE_URL=http://localhost:3100 node scripts/api-e2e.mjs
 *   API_E2E_READONLY=1 BASE_URL=https://... node scripts/api-e2e.mjs   # no writes
 *
 * Supabase URL/key come from the environment, falling back to .env.local.
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const READONLY = process.env.API_E2E_READONLY === "1";

function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = fs
      .readFileSync(".env.local", "utf8")
      .split("\n")
      .find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim();
  } catch {
    return undefined;
  }
}

const failures = [];
function check(name, ok, detail = "") {
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(name);
}

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON (an HTML error page) is itself a failure the checks will show.
  }
  return { status: res.status, json };
}

const quote = (subtotal) => {
  const shipping = subtotal >= 3500 ? 0 : 599;
  const tax = Math.round((subtotal * 725) / 10000);
  return { shipping, tax, total: subtotal + shipping + tax };
};

// ------------------------------------------------------------ public reads
console.log(`API e2e against ${BASE}${READONLY ? " (read-only)" : ""}`);

const health = await api("GET", "/health");
check("health: database reachable", health.status === 200 && health.json?.products === 268, JSON.stringify(health.json));

const cats = await api("GET", "/categories");
check(
  "categories: 10 departments with live counts",
  cats.json?.items?.length === 10 && cats.json.items.every((c) => c.count > 0),
);

const sony = await api("GET", "/products?q=sony+headphones");
check(
  "search: relevance ranks the brand match first",
  sony.json?.total > 0 && sony.json.items[0]?.brand === "Sony",
  `${sony.json?.total} results`,
);

const books = await api("GET", "/products?c=books&sort=price-asc&pageSize=48");
const prices = books.json?.items?.map((p) => p.priceCents) ?? [];
check(
  "search: category filter + price sort",
  prices.length > 0 && books.json.items.every((p) => p.category === "books") && prices.every((p, i) => i === 0 || p >= prices[i - 1]),
);

const clamped = await api("GET", "/products?q=lego&page=999&pageSize=5");
check("search: out-of-range page clamps to the last page", clamped.json?.page === clamped.json?.pageCount);
check("search: pageSize respected", clamped.json?.items?.length <= 5);

const topBrand = (await api("GET", "/facets?c=electronics")).json?.brands?.[0]?.value;
const faceted = await api("GET", `/facets?c=electronics&brand=${encodeURIComponent(topBrand ?? "")}`);
check(
  "facets: brand counts ignore the brand filter itself",
  faceted.json?.brands?.length > 1,
  `${faceted.json?.brands?.length} brands with ${topBrand} selected`,
);

const product = await api("GET", "/products/B0DBF65JYY");
check("product: lookup by ASIN", product.status === 200 && /medicube/i.test(product.json?.title ?? ""));
check("product: unknown ASIN is 404", (await api("GET", "/products/ZZZZZZZZZZ")).status === 404);

const deals = await api("GET", "/deals?limit=10");
const dealItems = deals.json?.items ?? [];
check("deals: every item is discounted", dealItems.length === 10 && dealItems.every((p) => p.listPriceCents > p.priceCents));
check("deals: first three span three departments", new Set(dealItems.slice(0, 3).map((p) => p.category)).size === 3);

const recs = await api("GET", "/recommendations?asins=B00NHQF6MG&limit=6");
check(
  "recommendations: seeded from the given item's department",
  recs.json?.items?.length === 6 && recs.json.items[0]?.category === "toys" && !recs.json.items.some((p) => p.asin === "B00NHQF6MG"),
);

const suggest = await api("GET", "/suggest?q=so");
check("suggest: autocomplete", suggest.json?.suggestions?.length > 0);

const reviewsRead = await api("GET", "/products/B0DBF65JYY/reviews");
check("reviews: histogram has five rows", reviewsRead.json?.histogram?.length === 5);

check("auth: cart requires a token", (await api("GET", "/cart")).status === 401);
check("auth: bad token rejected", (await api("GET", "/cart", { token: "nope" })).status === 401);

// ------------------------------------------------------------------ writes
if (!READONLY) {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ?? env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  async function shopper(tag) {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const email = `e2e+api-${tag}-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password: `pw-${Math.random().toString(36).slice(2)}-A1!`,
      options: { data: { name: `API ${tag}` } },
    });
    if (error || !data.session) throw new Error(`signup failed: ${error?.message ?? "no session (email confirmation on?)"}`);
    return data.session.access_token;
  }

  const alice = await shopper("alice");
  const bob = await shopper("bob");
  check("auth: two shoppers signed up via Supabase Auth", Boolean(alice && bob));

  // A thinly reviewed product, so one review visibly moves the average.
  const thin = (await api("GET", "/products?sort=featured&pageSize=48&c=books")).json.items
    .concat((await api("GET", "/products?pageSize=48&c=tools")).json.items)
    .sort((a, b) => a.reviewCount - b.reviewCount)[0];
  const [a1, a2] = (await api("GET", "/products?c=toys&pageSize=2")).json.items;

  // ---- cart
  let cart = await api("POST", "/cart/items", { token: alice, body: { asin: a1.asin, qty: 2 } });
  check("cart: add", cart.status === 201 && cart.json?.count === 2);
  cart = await api("POST", "/cart/items", { token: alice, body: { asin: a1.asin, qty: 1 } });
  check("cart: adding again increments", cart.json?.count === 3);
  cart = await api("POST", "/cart/items", { token: alice, body: { asin: a2.asin } });
  cart = await api("POST", "/cart/items", { token: alice, body: { asin: thin.asin } });
  cart = await api("PATCH", `/cart/items/${thin.asin}`, { token: alice, body: { saved: true } });
  check("cart: save for later leaves the active count alone", cart.json?.count === 4);
  check("cart: unknown product is 404", (await api("POST", "/cart/items", { token: alice, body: { asin: "ZZZZZZZZZZ" } })).status === 404);
  check("cart: qty over the cap is 400", (await api("POST", "/cart/items", { token: alice, body: { asin: a1.asin, qty: 31 } })).status === 400);
  check("cart: malformed JSON is 400", (await fetch(`${BASE}/api/v1/cart/items`, { method: "POST", headers: { Authorization: `Bearer ${alice}`, "Content-Type": "application/json" }, body: "{" })).status === 400);

  cart = await api("GET", "/cart", { token: alice });
  const subtotal = a1.priceCents * 3 + a2.priceCents;
  const q = quote(subtotal);
  check(
    "cart: totals come from database prices",
    cart.json?.subtotalCents === subtotal && cart.json?.shippingCents === q.shipping && cart.json?.taxCents === q.tax && cart.json?.totalCents === q.total,
    `${cart.json?.totalCents} vs ${q.total}`,
  );
  check("cart: isolated per shopper", (await api("GET", "/cart", { token: bob })).json?.lines?.length === 0);

  // ---- checkout
  const bad = await api("POST", "/orders", { token: alice, body: { shipTo: { fullName: "Alice" } } });
  check("orders: incomplete address is 422", bad.status === 422 && bad.json?.error?.code === "invalid_address");

  const shipTo = { fullName: "Alice Example", line1: "1 Test St", city: "Portland", state: "OR", postalCode: "97201" };
  const placed = await api("POST", "/orders", { token: alice, body: { shipTo, paymentLast4: "4111 1111 1111 1234" } });
  const order = placed.json?.order;
  check("orders: placed", placed.status === 201 && Boolean(placed.json?.id));
  check("orders: total priced server-side", order?.totalCents === q.total && order?.subtotalCents === subtotal);
  check(
    "orders: line items snapshot the product price",
    order?.items?.length === 2 && order.items.every((i) => i.priceCents === (i.asin === a1.asin ? a1.priceCents : a2.priceCents)),
  );
  check("orders: only the card's last four digits are stored", order?.paymentLast4 === "1234");

  cart = await api("GET", "/cart", { token: alice });
  check(
    "orders: checkout clears active lines but keeps saved-for-later",
    cart.json?.count === 0 && cart.json?.lines?.length === 1 && cart.json.lines[0].saved === true,
  );
  const again = await api("POST", "/orders", { token: alice, body: { shipTo } });
  check("orders: empty cart is 409", again.status === 409 && again.json?.error?.code === "cart_empty");

  const list = await api("GET", "/orders", { token: alice });
  check("orders: history lists the order", list.json?.items?.some((o) => o.id === placed.json?.id));
  check("orders: another shopper gets 404", (await api("GET", `/orders/${placed.json?.id}`, { token: bob })).status === 404);
  check("orders: malformed id is 404", (await api("GET", "/orders/not-a-uuid", { token: alice })).status === 404);

  // ---- reviews move the rating
  const before = (await api("GET", `/products/${thin.asin}`)).json;
  const posted = await api("POST", `/products/${thin.asin}/reviews`, {
    token: alice,
    body: { rating: 1, title: "API e2e", body: "Written by scripts/api-e2e.mjs and deleted straight after." },
  });
  check("reviews: post", posted.status === 201 && posted.json?.rating === 1 && !("userId" in (posted.json ?? {})));
  check("reviews: invalid rating is 422", (await api("POST", `/products/${thin.asin}/reviews`, { token: alice, body: { rating: 9, body: "nope nope" } })).status === 422);

  const after = (await api("GET", `/products/${thin.asin}`)).json;
  const expected = Math.round(((before.rating * before.reviewCount + 1) / (before.reviewCount + 1)) * 100) / 100;
  check("reviews: count includes the new review", after.reviewCount === before.reviewCount + 1 && after.haulReviewCount === before.haulReviewCount + 1);
  check("reviews: blended rating moves (trigger)", Math.abs(after.rating - expected) < 0.011, `${before.rating} -> ${after.rating}, expected ~${expected}`);
  const listed = (await api("GET", `/products/${thin.asin}/reviews`)).json;
  check("reviews: listed with histogram", listed.items?.some((r) => r.title === "API e2e") && listed.histogram.find((h) => h.stars === 1)?.count >= 1);

  check("reviews: delete", (await api("DELETE", `/products/${thin.asin}/reviews/mine`, { token: alice })).status === 204);
  const reverted = (await api("GET", `/products/${thin.asin}`)).json;
  check("reviews: rating reverts after delete", reverted.reviewCount === before.reviewCount && reverted.rating === before.rating);

  // ---- wish list
  check("wishlist: add", (await api("PUT", `/wishlist/${a1.asin}`, { token: bob })).status === 204);
  check("wishlist: add is idempotent", (await api("PUT", `/wishlist/${a1.asin}`, { token: bob })).status === 204);
  check("wishlist: lists it", (await api("GET", "/wishlist", { token: bob })).json?.items?.[0]?.asin === a1.asin);
  check("wishlist: remove", (await api("DELETE", `/wishlist/${a1.asin}`, { token: bob })).status === 204);
  check("wishlist: empty again", (await api("GET", "/wishlist", { token: bob })).json?.items?.length === 0);
}

console.log(failures.length ? `\n${failures.length} FAILED` : "\nAll API checks passed");
process.exit(failures.length ? 1 : 0);
