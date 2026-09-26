import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "REST API",
  description: "The HAUL REST API: catalogue, reviews, cart, wish list and orders over HTTP, backed by Postgres.",
};

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type Endpoint = {
  method: Method;
  path: string;
  auth?: boolean;
  summary: string;
  params?: [string, string][];
  body?: string;
  returns: string;
  example?: string;
};

const METHOD_TONE: Record<Method, string> = {
  GET: "bg-lime text-ink",
  POST: "bg-pink text-ink",
  PATCH: "bg-sun text-ink",
  PUT: "bg-sky text-ink",
  DELETE: "bg-ink text-paper",
};

/** Mirrors src/app/api/v1. If a route changes, change it here too. */
const GROUPS: { id: string; title: string; blurb: string; endpoints: Endpoint[] }[] = [
  {
    id: "catalogue",
    title: "Catalogue",
    blurb:
      "Public and CDN-cacheable. Search, facets and shelves are SQL functions in Postgres; the storefront pages call exactly the same ones.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/health",
        summary: "Liveness plus a real round trip to Postgres. Never cached.",
        returns: "{ ok, products, dbLatencyMs }",
      },
      {
        method: "GET",
        path: "/api/v1/categories",
        summary: "The ten departments with live product counts.",
        returns: "{ items: [{ slug, name, short, count }] }",
      },
      {
        method: "GET",
        path: "/api/v1/products",
        summary: "Search and browse. Takes exactly the query string the /s page uses.",
        params: [
          ["q", "Search text. Every word must match (AND); brand and title-start hits rank higher."],
          ["c", "Department slug, e.g. electronics"],
          ["brand", "Brand name; repeat it or separate with | for several"],
          ["min, max", "Price bounds in cents"],
          ["rating", "Minimum star rating, e.g. 4"],
          ["express, deals", "Set to 1 to keep only Express or discounted items"],
          ["sort", "featured · price-asc · price-desc · rating · reviews · newest"],
          ["page, pageSize", "1-based page (clamped to the last page); pageSize 1–48, default 16"],
        ],
        returns: "{ items: Product[], total, page, pageSize, pageCount }",
        example: "/api/v1/products?q=sony+headphones&sort=price-asc&pageSize=3",
      },
      {
        method: "GET",
        path: "/api/v1/facets",
        summary: "Filter counts for the same parameters. Each dimension ignores its own selection.",
        returns: "{ brands: [{ value, count }], categories: [{ slug, name, count }], priceBuckets: [{ label, min, max, count }] }",
        example: "/api/v1/facets?c=electronics",
      },
      {
        method: "GET",
        path: "/api/v1/products/{asin}",
        summary: "One product. 404 if the ASIN is unknown.",
        returns: "Product",
        example: "/api/v1/products/B0DBF65JYY",
      },
      {
        method: "GET",
        path: "/api/v1/products/{asin}/related",
        summary: "Same-department picks by popularity, or the nearest in price.",
        params: [
          ["kind", "category (default) or price"],
          ["limit", "1–48, default 12"],
        ],
        returns: "{ kind, items: Product[] }",
      },
      {
        method: "GET",
        path: "/api/v1/deals",
        summary: "Discounted products, interleaved across departments.",
        params: [["limit", "1–60, default 24"]],
        returns: "{ items: Product[] }",
      },
      {
        method: "GET",
        path: "/api/v1/recommendations",
        summary: "What goes with a set of products, e.g. a cart. Draws from their departments, topped up with best sellers.",
        params: [
          ["asins", "Comma-separated ASINs"],
          ["limit", "1–48, default 14"],
        ],
        returns: "{ items: Product[] }",
      },
      {
        method: "GET",
        path: "/api/v1/suggest",
        summary: "Search-box autocomplete.",
        params: [["q", "Partial query"]],
        returns: "{ suggestions: string[] }",
        example: "/api/v1/suggest?q=so",
      },
    ],
  },
  {
    id: "reviews",
    title: "Reviews",
    blurb:
      "Only real reviews. Writing one fires a Postgres trigger that folds it into the product's blended rating and count, so the effect is immediately visible on the product.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/products/{asin}/reviews",
        summary: "Reviews, newest first, with the star histogram.",
        params: [
          ["limit", "1–50, default 20"],
          ["offset", "Default 0"],
        ],
        returns: "{ rating, reviewCount, haulReviewCount, histogram: [{ stars, count, pct }], total, items: Review[] }",
      },
      {
        method: "POST",
        path: "/api/v1/products/{asin}/reviews",
        auth: true,
        summary: "Create or replace your review of a product (one per shopper per product).",
        body: '{ "rating": 5, "title": "Loud and lovely", "body": "At least four characters." }',
        returns: "201 Review · 422 invalid_review",
      },
      {
        method: "DELETE",
        path: "/api/v1/products/{asin}/reviews/mine",
        auth: true,
        summary: "Delete your review. The rating reverts.",
        returns: "204 · 404 if you had none",
      },
    ],
  },
  {
    id: "cart",
    title: "Cart",
    blurb:
      "The signed-in cart in Postgres. Totals use prices from the products table, never from the request. (Guest carts live in a browser cookie and are not exposed.)",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/cart",
        auth: true,
        summary: "Lines with their products, plus totals for the active (not saved-for-later) lines.",
        returns: "{ lines: [{ asin, qty, saved, product }], count, subtotalCents, shippingCents, taxCents, totalCents }",
      },
      {
        method: "POST",
        path: "/api/v1/cart/items",
        auth: true,
        summary: "Add a product. Adding one already in the cart increases its quantity (max 30).",
        body: '{ "asin": "B0DBF65JYY", "qty": 2 }',
        returns: "201 cart · 400 invalid_qty · 404 unknown product",
      },
      {
        method: "PATCH",
        path: "/api/v1/cart/items/{asin}",
        auth: true,
        summary: "Change quantity and/or move between the cart and saved-for-later.",
        body: '{ "qty": 3, "saved": false }',
        returns: "cart · 404 if the line isn't in your cart",
      },
      {
        method: "DELETE",
        path: "/api/v1/cart/items/{asin}",
        auth: true,
        summary: "Remove a line.",
        returns: "cart",
      },
    ],
  },
  {
    id: "wishlist",
    title: "Wish list",
    blurb: "Idempotent: adding twice or removing something absent both succeed.",
    endpoints: [
      { method: "GET", path: "/api/v1/wishlist", auth: true, summary: "Saved products, newest first.", returns: "{ items: Product[] }" },
      { method: "PUT", path: "/api/v1/wishlist/{asin}", auth: true, summary: "Save a product.", returns: "204 · 404 unknown product" },
      { method: "DELETE", path: "/api/v1/wishlist/{asin}", auth: true, summary: "Unsave a product.", returns: "204" },
    ],
  },
  {
    id: "orders",
    title: "Orders",
    blurb:
      "Checkout is one call to the place_order() SQL function: it prices every line from the products table, writes the order and its items, and clears the active cart in a single transaction.",
    endpoints: [
      { method: "GET", path: "/api/v1/orders", auth: true, summary: "Your orders, newest first (up to 50).", returns: "{ items: Order[] }" },
      {
        method: "POST",
        path: "/api/v1/orders",
        auth: true,
        summary: "Check out the active lines in your cart. Saved-for-later lines stay put.",
        body: '{ "shipTo": { "fullName": "Ada L.", "line1": "1 Main St", "city": "Portland", "state": "OR", "postalCode": "97201" }, "paymentLast4": "4242" }',
        returns: "201 { id, order } · 409 cart_empty · 422 invalid_address",
      },
      {
        method: "GET",
        path: "/api/v1/orders/{id}",
        auth: true,
        summary: "One order. Someone else's order is a 404, indistinguishable from a missing one.",
        returns: "Order",
      },
    ],
  },
];

export default async function ApiDocsPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "your-host";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  return (
    <Container className="py-8 md:py-12">
      {/* --------------------------------------------------------- intro */}
      <section className="brut relative overflow-hidden bg-sky p-6 md:p-10">
        <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-[0.12]" />
        <div className="relative max-w-3xl">
          <p className="font-mono text-[12px] font-bold uppercase tracking-[0.16em]">Developers · v1</p>
          <h1 className="mt-3 font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.03em] md:text-[72px]">
            HAUL REST API
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed">
            Everything the storefront does, over HTTP: search the catalogue, read and write reviews, fill a cart and
            check out. It is the same Postgres the pages read from; nothing here is mocked.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/api/v1" variant="ink" prefetch={false}>
              JSON index
            </ButtonLink>
            <ButtonLink href="/api/v1/health" variant="secondary" prefetch={false}>
              Health check
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* ------------------------------------------------------ contents */}
        <nav aria-label="API sections" className="lg:sticky lg:top-44 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col">
            {[["auth", "Authentication"], ["errors", "Errors"], ...GROUPS.map((g) => [g.id, g.title])].map(([id, title]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="inline-flex h-9 items-center whitespace-nowrap rounded-full border-2 border-ink bg-card px-3.5 text-[13px] font-semibold hover:bg-ink hover:text-paper lg:w-full"
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-14">
          {/* ------------------------------------------------------- auth */}
          <section id="auth" className="scroll-mt-44">
            <SectionHeading title="Authentication" />
            <div className="space-y-4 text-[16px] leading-relaxed">
              <p>
                Catalogue and review reads are public. Everything personal needs a signed-in shopper, in one of two ways:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Bearer token.</strong> Send <Code>Authorization: Bearer &lt;access_token&gt;</Code>, where the
                  token is the Supabase Auth access token you get from signing in (for example{" "}
                  <Code>supabase.auth.signInWithPassword()</Code> with this project&apos;s public URL and publishable key).
                </li>
                <li>
                  <strong>Browser session.</strong> Called from a browser that is signed in to HAUL, the session cookie
                  is used automatically.
                </li>
              </ul>
              <p>
                Either way the request runs as <em>you</em>: the database client carries your JWT, and Postgres row-level
                security decides what can be read or written. That is why another shopper&apos;s order is simply a 404.
              </p>
              <Pre>{`curl ${origin}/api/v1/cart \\
  -H "Authorization: Bearer $HAUL_TOKEN"`}</Pre>
            </div>
          </section>

          {/* ----------------------------------------------------- errors */}
          <section id="errors" className="scroll-mt-44">
            <SectionHeading title="Errors" />
            <p className="mb-4 text-[16px] leading-relaxed">
              Every error has the same shape, so clients can branch on <Code>code</Code>:
            </p>
            <Pre>{`HTTP/1.1 409 Conflict
{ "error": { "code": "cart_empty", "message": "Your cart is empty." } }`}</Pre>
            <p className="mt-4 font-mono text-[13px] text-muted">
              400 bad input · 401 unauthenticated · 404 not found · 409 cart_empty · 422 validation · 503 database down
            </p>
          </section>

          {/* -------------------------------------------------- endpoints */}
          {GROUPS.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-44">
              <SectionHeading title={group.title} />
              <p className="mb-6 max-w-3xl text-[16px] leading-relaxed">{group.blurb}</p>
              <ul className="space-y-5">
                {group.endpoints.map((e) => (
                  <li key={`${e.method} ${e.path}`} className="brut min-w-0 bg-card">
                    <div className="flex flex-wrap items-center gap-3 border-b-[3px] border-ink px-4 py-3">
                      <span
                        className={`inline-flex h-7 min-w-[64px] items-center justify-center border-2 border-ink px-2 font-mono text-[12px] font-bold ${METHOD_TONE[e.method]}`}
                      >
                        {e.method}
                      </span>
                      <code className="min-w-0 break-all font-mono text-[14px] font-bold">{e.path}</code>
                      <span
                        className={`ml-auto font-mono text-[11px] font-bold uppercase tracking-wider ${e.auth ? "text-ink" : "text-muted"}`}
                      >
                        {e.auth ? "Sign-in required" : "Public"}
                      </span>
                    </div>
                    <div className="space-y-4 p-4">
                      <p>{e.summary}</p>
                      {e.params && (
                        <table className="w-full text-left text-[14px]">
                          <caption className="sr-only">Query parameters</caption>
                          <tbody>
                            {e.params.map(([name, desc]) => (
                              <tr key={name} className="border-t-2 border-ink/10 align-top first:border-0">
                                <th scope="row" className="w-[30%] py-1.5 pr-3 font-mono text-[13px] font-bold">
                                  {name}
                                </th>
                                <td className="py-1.5">{desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      {e.body && (
                        <div>
                          <p className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
                            JSON body
                          </p>
                          <Pre>{e.body}</Pre>
                        </div>
                      )}
                      <p className="font-mono text-[13px]">
                        <span className="font-bold uppercase text-muted">Returns </span>
                        {e.returns}
                      </p>
                      {e.example && (
                        <div>
                          <p className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
                            Try it
                          </p>
                          <Pre>{`curl "${origin}${e.example}"`}</Pre>
                          <Link href={e.example} prefetch={false} className="link mt-2 inline-block font-mono text-[13px]">
                            Open in browser →
                          </Link>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="break-words border-2 border-ink/20 bg-paper-deep px-1 font-mono text-[0.9em]">{children}</code>;
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto border-[3px] border-ink bg-ink p-4 font-mono text-[13px] leading-relaxed text-lime">
      <code>{children}</code>
    </pre>
  );
}
