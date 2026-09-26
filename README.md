# HAUL

[![CI](https://github.com/Mahad-007/haul/actions/workflows/ci.yml/badge.svg)](https://github.com/Mahad-007/haul/actions/workflows/ci.yml)
[![Post-deploy smoke](https://github.com/Mahad-007/haul/actions/workflows/smoke.yml/badge.svg)](https://github.com/Mahad-007/haul/actions/workflows/smoke.yml)

**A loud little store for stuff worth hauling home.** It has its own
neo-brutalist interface, runs on a real Postgres backend and exposes a public
REST API.

### → **[haul-shop.vercel.app](https://haul-shop.vercel.app)** · [API docs](https://haul-shop.vercel.app/api)

Open it signed out and buy something: search, filter, add to cart, create an
account, check out, then review what you bought and watch the product's rating
move.

![HAUL home page](.github/media/home.png)

---

## What changed in this version

The first version was a pixel-level rebuild of amazon.com. 8x revised the brief:
keep the idea and the backend, design the interface yourself, and make the
backend real, meaning a working database and API with no mock data. This
version does both.

| | Before | Now |
| --- | --- | --- |
| **Catalogue** | JSON file bundled at build time | `public.products` in Postgres, seeded by a migration |
| **Search, facets, shelves** | JavaScript over an in-memory array | SQL functions, verified identical to the old logic on 11 queries |
| **Reviews** | Generated text and an invented histogram | Real rows only. A trigger folds each review into the product's rating |
| **Checkout** | Client-side inserts, with a rollback that RLS silently blocked | One transactional `place_order()` that prices every line from the database |
| **API** | None | 22 endpoints at [`/api/v1`](https://haul-shop.vercel.app/api), with bearer or session auth |
| **Interface** | Amazon's layout, colours and wordmark | HAUL: an original design system (see [DESIGN.md](DESIGN.md)) |
| **CI** | Built without a database | Starts a throwaway Supabase, applies every migration and runs 3 e2e suites |

## The design

HAUL is **neo-brutalist**: warm cream paper, 3px ink borders, hard offset
shadows, one display face, and four accents with one job each. Lime means
act, pink means save, cobalt means go, and sun means rate. The style was
picked for a store because its building blocks make shopping clearer: thick
outlines turn buttons into obvious buttons, hard shadows give a real pressed
state, and heavy borders make keyboard focus hard to miss. NN/g's guidance on
the style mostly concerns restraint, and the system follows it: a small
palette, a neutral body font, contrast-checked pairs and generous padding on
dense pages.

Choices that make it HAUL rather than a reskin:

- **Editorial home page.** No carousel. Instead there is one statement, the
  best live deal, a discount ticker, numbered departments, and a ranked
  top-rated list with big numerals.
- **Colour carries meaning.** Each department gets a tint, and product photos
  blend into it (`mix-blend-multiply`), so a grid reads like a poster instead
  of a wall of white boxes.
- **The cart is a receipt.** Mono type, dashed rules, and a lime progress bar
  toward free shipping.
- **Checkout is three numbered steps** on one page, with a sticky receipt.

Tokens, primitives and rules are documented in **[DESIGN.md](DESIGN.md)**.

## Architecture

**Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres + Auth)**

```
Browser ──► Next.js server components ─┐
                                       ├──► src/lib/catalog.ts ──► SQL functions (search, facets, deals, …)
curl / apps ──► /api/v1 route handlers ┘    src/lib/cart.ts, orders.ts, reviews.ts ──► tables under RLS
                                            place_order() ──► one transaction
```

Pages and the REST API call the same library functions, which call the same
SQL. Neither has a private shortcut to the data.

- **Postgres is the source of truth.** Everything is defined in
  [`supabase/migrations/`](supabase/migrations):
  - `0002_catalog.sql`: tables and functions.
  - `0003`: the generated seed.
  - `0004`: foreign keys and the review trigger.
  - `0005`: RLS hardening from `supabase db advisors`.
  - `0007`: closes the direct-write paths found in review (below).
- **Row-level security does the authorisation.** API writes run as the calling
  user, whether through a Supabase bearer token or the browser session, so
  Postgres decides what they can touch. Asking for another shopper's order
  returns 404, because RLS makes it indistinguishable from a missing one.
- **The database is the security boundary, not the app.** The Supabase anon
  key ships to every browser, so anything PostgREST allows is public API.
  Orders and reviews can only be written through their functions; direct
  inserts are revoked, and reviewers' auth ids can't be read at all. The API
  e2e suite tries each forgery against the database directly.
- **Checkout can't be tampered with.** `place_order()` is the only way to
  create an order. In one transaction it:
  - takes the active cart lines in a single `delete … returning`, so a
    double-submit finds an empty cart and a line added mid-checkout is never
    charged-but-lost;
  - prices each line from `products` and caps quantities at stock;
  - writes the order and its line-item snapshots, leaving saved-for-later
    items alone.
- **Cart writes are single statements.** Adding is an atomic
  `insert … on conflict do update`, so six parallel adds make six, not one.
- **Real reviews move the rating.** `products.rating` is a generated column
  that blends the scraped marketplace rating with HAUL reviews. The trigger
  keeps the totals current, and the histogram is a view over real rows.
- **Catalogue reads are cached.** They go through a cookie-less anon client
  into the Next data cache under a `catalog` tag. A review write expires the
  tag, so its effect on ratings shows up immediately.
- **Search state lives in the URL.** Every filter is a plain link, so results
  are server-rendered, shareable and back-button safe. Each facet is counted
  ignoring its own filter, so ticking one brand never hides the others.
- **The purchase flow works without JavaScript.** Add to cart, buy now,
  quantity, delete, save for later, search, sign-in, checkout and sign-out are
  all real `<form>`s.
- **Carts have two backends behind one interface.** Guests use a cookie and
  signed-in shoppers use Postgres. At sign-in the guest cart is merged in,
  summing quantities and dropping any product that no longer exists.

## REST API

Human-readable docs live at **[/api](https://haul-shop.vercel.app/api)**, and a
JSON index at [`/api/v1`](https://haul-shop.vercel.app/api/v1).

```bash
curl "https://haul-shop.vercel.app/api/v1/products?q=headphones&sort=rating&pageSize=3"
curl  https://haul-shop.vercel.app/api/v1/products/B0DBF65JYY/reviews

# Signed-in endpoints take a Supabase access token:
curl -X POST https://haul-shop.vercel.app/api/v1/cart/items \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"asin":"B00NHQF6MG","qty":2}'
```

| Group | Endpoints |
| --- | --- |
| **Catalogue** (public, CDN-cached) | `GET /products`, `/products/{asin}`, `/products/{asin}/related`, `/facets`, `/categories`, `/deals`, `/recommendations`, `/suggest`, `/health` |
| **Reviews** | `GET /products/{asin}/reviews` · `POST` (auth) · `DELETE /products/{asin}/reviews/mine` (auth) |
| **Cart** (auth) | `GET /cart` · `POST /cart/items` · `PATCH`/`DELETE /cart/items/{asin}` |
| **Wish list** (auth) | `GET /wishlist` · `PUT`/`DELETE /wishlist/{asin}` |
| **Orders** (auth) | `GET /orders` · `GET /orders/{id}` · `POST /orders` |

Every error uses the same shape: `{ "error": { "code", "message" } }`. The
statuses are 400, 401, 404, 409 (`cart_empty`) and 422.

## Running it

```bash
npm install
npx supabase start      # local Postgres + Auth; applies every migration, seed included
cp .env.example .env.local   # paste the local API URL and publishable key it prints
npm run dev
```

**Tests.** All three suites run against real Postgres; nothing is mocked:

```bash
node scripts/api-e2e.mjs       # 59 REST checks: two shoppers, pricing, isolation, forged writes, races
node scripts/e2e.mjs           # guest cart in a real browser
node scripts/e2e-checkout.mjs  # register -> checkout -> order history -> review
node scripts/layout-check.mjs / /s /cart   # no horizontal overflow at 390px, no broken images
```

**CI** ([`ci.yml`](.github/workflows/ci.yml)) runs on every push:

1. Checks that the seed JSON and the seed migration both regenerate
   byte-for-byte.
2. Fails if anything in `src` imports a fixture.
3. Starts a throwaway Supabase, which applies every migration from scratch.
4. Builds the app and runs all three suites against it.

Production is never written to by automation.
**[`smoke.yml`](.github/workflows/smoke.yml)** runs read-only checks against
each production deploy.

## The data

The catalogue started as a scrape of public marketplace search results. The
raw scrape is vendored in `scripts/raw/`, and two scripts turn it into the
seed migration:

```bash
node scripts/build-catalog.mjs scripts/raw          # -> supabase/seed/products.json
node scripts/catalog-to-sql.mjs > supabase/migrations/0003_catalog_seed.sql
```

- **Real, from the source listings:** titles, prices, list prices, ratings,
  review counts, "bought in past month" figures, badges and product images.
  Images are served by the source CDN.
- **Derived at seed time, stable per product:** department, feature bullets,
  variant options and stock.
- **Honest caveats:**
  - **39 of 268 prices are synthesised.** The source listed a price range or
    no price for those items. The data says which ones: `price_synthesised`.
  - **Every product has exactly one photo.**
  - **Variant pickers are presentational.** One listing is one product.

## Deliberately not built

- **Real payments.** Checkout stores only the card's last four digits.
  Integrating Stripe would demonstrate Stripe, not product judgement.
- **A stock ledger.** Stock caps each order but isn't decremented, so the
  demo never sells out under reviewers' test orders.
- **Seller accounts, returns, subscriptions.** Breadth that wouldn't improve
  the core purchase loop.
- **Dark mode.** The palette is designed around cream paper. A second theme
  would need its own contrast pass, and it wasn't the best use of the time.

## How this was built with AI agents

`.agent-logs/` holds every prompt and response from the Claude Code sessions,
committed as the work happened. `scripts/capture.mjs` writes them and removes
credentials first.

The redesign session followed this sequence:

1. **Plan.** Parallel read-only agents mapped the frontend and the data layer,
   and a planning agent designed the SQL. The plan was agreed before any code:
   brand name, palette, and moving the backend first.
2. **Backend first.** The migrations were validated on a local Supabase, then
   parity-tested against the old JavaScript search, then pushed.
3. **Redesign.** I built the design system, shell and home page. Four parallel
   agents then each rebuilt one group of routes against those primitives, and
   a mobile overflow audit caught layout bugs along the way.
4. **Review.** A final pass over the full diff, then all e2e suites, locally
   and in CI.
