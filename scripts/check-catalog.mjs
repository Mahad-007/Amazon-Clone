/**
 * Catalogue integrity gate for CI.
 *
 * src/data/products.json is generated, committed, and read by every page. A
 * malformed entry would not fail typecheck — it would ship a broken grid. So
 * the shape is asserted here instead.
 */
import fs from "node:fs";

const products = JSON.parse(fs.readFileSync("src/data/products.json", "utf8"));
const CATEGORIES = [
  "electronics", "computers", "home-kitchen", "fashion", "sports",
  "toys", "beauty", "tools", "pets", "books",
];

const errors = [];
const seen = new Set();

for (const [i, p] of products.entries()) {
  const at = `products[${i}] (${p?.asin ?? "no asin"})`;

  if (!p.asin || typeof p.asin !== "string") errors.push(`${at}: missing asin`);
  if (seen.has(p.asin)) errors.push(`${at}: duplicate asin`);
  seen.add(p.asin);

  if (!p.title?.trim()) errors.push(`${at}: empty title`);
  if (!p.shortTitle?.trim()) errors.push(`${at}: empty shortTitle`);
  if (!p.brand?.trim()) errors.push(`${at}: empty brand`);

  if (!Number.isInteger(p.priceCents) || p.priceCents <= 0) {
    errors.push(`${at}: bad priceCents ${p.priceCents}`);
  }
  if (p.listPriceCents != null && p.listPriceCents <= p.priceCents) {
    errors.push(`${at}: listPrice ${p.listPriceCents} <= price ${p.priceCents}`);
  }

  if (!(p.rating >= 0 && p.rating <= 5)) errors.push(`${at}: rating ${p.rating}`);
  if (!Number.isInteger(p.reviewCount) || p.reviewCount < 0) {
    errors.push(`${at}: reviewCount ${p.reviewCount}`);
  }

  if (!CATEGORIES.includes(p.category)) errors.push(`${at}: category ${p.category}`);
  if (!/^https:\/\/m\.media-amazon\.com\//.test(p.image)) {
    errors.push(`${at}: image not an Amazon CDN url`);
  }
  if (!Array.isArray(p.images) || p.images.length === 0) {
    errors.push(`${at}: no images`);
  }
  if (!Array.isArray(p.bullets) || p.bullets.length < 3) {
    errors.push(`${at}: fewer than 3 bullets`);
  }
  if (!Number.isInteger(p.stock) || p.stock < 0) errors.push(`${at}: stock ${p.stock}`);
}

// Every department must be populated, or the storefront has an empty aisle.
const counts = {};
for (const p of products) counts[p.category] = (counts[p.category] ?? 0) + 1;
for (const c of CATEGORIES) {
  if (!counts[c]) errors.push(`department "${c}" has no products`);
}

if (errors.length) {
  console.error(`catalogue check FAILED (${errors.length} problems):`);
  for (const e of errors.slice(0, 25)) console.error("  -", e);
  process.exit(1);
}

console.log(
  `catalogue OK: ${products.length} products, ${Object.keys(counts).length} departments, ` +
    `${new Set(products.map((p) => p.brand)).size} brands`,
);
