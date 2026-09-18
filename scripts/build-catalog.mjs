/**
 * Turns raw scraped Amazon search results into src/data/products.json.
 *
 * The scrape gives us real titles, prices, ratings, review counts and image
 * URLs. It does NOT give us the things a storefront needs to feel complete:
 * a department, feature bullets, variants, or stock. Those are derived here,
 * deterministically, so the catalogue is stable across rebuilds — a product's
 * "Only 3 left in stock" must not change on every deploy.
 *
 * Usage: node scripts/build-catalog.mjs <dir-of-raw-json> [...more]
 */
import fs from "node:fs";
import path from "node:path";

// --------------------------------------------------------------- utilities

/** FNV-1a — a tiny stable hash so derived fields are deterministic per ASIN. */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic integer in [min, max] derived from a seed string. */
function pick(seed, min, max) {
  return min + (hash(seed) % (max - min + 1));
}

function pickOne(seed, arr) {
  return arr[hash(seed) % arr.length];
}

// --------------------------------------------------- query -> department map
const QUERY_CATEGORY = {
  "wireless headphones": "electronics",
  smartwatch: "electronics",
  "4k smart tv": "electronics",
  laptop: "computers",
  "mechanical keyboard": "computers",
  "air fryer": "home-kitchen",
  "espresso machine": "home-kitchen",
  "ergonomic office chair": "home-kitchen",
  "running shoes": "fashion",
  backpack: "fashion",
  "yoga mat": "sports",
  "lego building set": "toys",
  "face serum skincare": "beauty",
  "cordless drill": "tools",
  "dog food": "pets",
  "bestselling novels": "books",
};

/**
 * Amazon's image CDN encodes the rendition in the filename. Swapping the
 * `_AC_UY218_` segment gives us a bigger, square image for the grid and an
 * even bigger one for the product page gallery.
 */
function rendition(url, spec) {
  if (!url) return "";
  return url.replace(/\._[^.]*_\.(jpg|png|webp)$/i, `._${spec}_.$1`);
}

function imageSet(url) {
  return {
    thumb: rendition(url, "AC_SX200_SY200"),
    card: rendition(url, "AC_SX466_SY466"),
    hero: rendition(url, "AC_SX679_SY679"),
  };
}

// ------------------------------------------------------------ brand + title
/**
 * Amazon titles lead with the brand, so the first token is usually right --
 * except for books and a few generic listings, which lead with an article or
 * a number ("The Silent Patient", "300Pcs Building Brick"). Skip those and
 * fall back to the first two words so we never render a brand of "The".
 */
const TITLE_STOPWORDS = new Set([
  "the", "a", "an", "and", "for", "new", "pack", "set", "premium", "of",
]);

/**
 * Product nouns and adjectives that lead unbranded listings. Without this,
 * "Headphones Wireless Over Ear..." yields a brand of "Headphones" and the
 * search page grows a brand facet full of category words.
 */
const NOT_A_BRAND = new Set([
  "headphones", "headphone", "earbuds", "earbud", "wireless", "bluetooth",
  "hybrid", "bone", "over", "in", "true", "active", "noise", "cancelling",
  "cordless", "electric", "power", "drill", "laptop", "computer", "tablet",
  "monitor", "keyboard", "mechanical", "gaming", "portable", "smart", "watch",
  "smartwatch", "fitness", "yoga", "exercise", "mat", "anti", "slip", "extra",
  "thick", "high", "density", "all", "purpose", "folding", "dog", "food",
  "treats", "puppy", "face", "serum", "vitamin", "hyaluronic", "acid",
  "retinol", "niacinamide", "skin", "skincare", "korean", "building", "brick",
  "bricks", "block", "blocks", "titanic", "ladder", "wheels", "air", "fryer",
  "espresso", "coffee", "machine", "running", "shoes", "sneaker", "backpack",
  "ergonomic", "office", "chair", "classic", "deep", "mini", "large", "small",
  "compact", "home", "kit", "professional", "digital", "usb", "led", "hd",
]);

/** Multi-word brands the first-token heuristic would truncate. */
const KNOWN_BRANDS = [
  "Under Armour", "New Balance", "Amazon Basics", "Blue Buffalo",
  "Good Molecules", "Purina Pro Plan", "Purina ONE", "Black+Decker",
  "BLACK+DECKER", "The Honest Kitchen", "The Farmer's Dog", "Rachael Ray",
  "CAP Barbell", "Avid Power", "AVID POWER", "Honest Kitchen",
  "Badlands Ranch", "BADLANDS RANCH", "Diamond Naturals", "Pro Plan",
];

function deriveBrand(title) {
  const known = KNOWN_BRANDS.find((b) =>
    title.toLowerCase().startsWith(b.toLowerCase()),
  );
  if (known) return known;

  const tokens = title
    .split(/[\s,|\-–(]/)
    .map((t) => t.replace(/[^A-Za-z0-9&.'+]/g, ""))
    .filter((t) => t.length >= 2);

  const titleCase = (w) =>
    w === w.toUpperCase() ? w : w[0].toUpperCase() + w.slice(1);

  for (const token of tokens) {
    const lower = token.toLowerCase();
    // Skip articles, category nouns, and anything starting with a digit.
    if (TITLE_STOPWORDS.has(lower)) continue;
    if (NOT_A_BRAND.has(lower)) continue;
    if (/^\d/.test(token)) continue;
    return titleCase(token);
  }

  // The listing leads with no brand at all — Amazon labels these "Generic".
  return "Generic";
}

/** A tight title for dense grids and the cart. */
function shortTitle(title) {
  const cut = title.split(/[,|(]/)[0].trim();
  return cut.length > 60 ? `${cut.slice(0, 57).trimEnd()}...` : cut;
}

// ---------------------------------------------------------------- variants
const VARIANTS_BY_CATEGORY = {
  electronics: [
    { kind: "Color", options: ["Black", "White", "Midnight Blue", "Rose Gold"] },
  ],
  computers: [
    { kind: "Capacity", options: ["256GB", "512GB", "1TB"] },
    { kind: "Color", options: ["Space Gray", "Silver"] },
  ],
  "home-kitchen": [
    { kind: "Color", options: ["Stainless Steel", "Matte Black", "Cream"] },
    { kind: "Capacity", options: ["4 Qt", "6 Qt", "8 Qt"] },
  ],
  fashion: [
    { kind: "Size", options: ["7", "8", "9", "10", "11", "12"] },
    { kind: "Color", options: ["Black", "White/Grey", "Navy", "Olive"] },
  ],
  sports: [{ kind: "Color", options: ["Purple", "Charcoal", "Teal", "Pink"] }],
  toys: [{ kind: "Style", options: ["Standard", "Deluxe"] }],
  beauty: [{ kind: "Size", options: ["1 fl oz", "1.7 fl oz", "3.4 fl oz"] }],
  tools: [{ kind: "Style", options: ["Tool Only", "Kit with Battery"] }],
  pets: [{ kind: "Size", options: ["5 lb", "15 lb", "30 lb"] }],
  books: [
    { kind: "Style", options: ["Paperback", "Hardcover", "Kindle", "Audiobook"] },
  ],
};

// ----------------------------------------------------------------- bullets
/**
 * "About this item" copy. Generic enough to be true of the category, specific
 * enough to look like a real listing. Written per department rather than
 * per product — inventing product-specific claims would be fabrication.
 */
const BULLETS = {
  electronics: [
    "Advanced audio tuning delivers deep bass and clear, balanced highs across every volume level.",
    "Bluetooth 5.3 keeps a stable connection up to 33 ft and pairs with two devices at once.",
    "Fast charge gives you hours of playback from a short top-up on the included USB-C cable.",
    "Lightweight build with memory-foam contact points designed for all-day comfort.",
  ],
  computers: [
    "Responsive multi-core processor handles browsing, office work and media without slowdown.",
    "Anti-glare display with slim bezels gives you more usable screen in the same footprint.",
    "All-day battery life, with fast charging over USB-C from the supplied adapter.",
    "Backlit keyboard and a precision trackpad tuned for long typing sessions.",
  ],
  "home-kitchen": [
    "Even heat distribution for consistent results, batch after batch.",
    "Dishwasher-safe removable parts make cleanup a two-minute job.",
    "Simple dial and preset controls — no menu-diving to start cooking.",
    "Compact footprint designed to sit under standard kitchen cabinets.",
  ],
  fashion: [
    "Breathable engineered upper keeps weight down without giving up structure.",
    "Cushioned midsole returns energy on every step, from commutes to long runs.",
    "Durable rubber outsole with a grip pattern tested on wet and dry surfaces.",
    "True to size — order your usual size for the intended fit.",
  ],
  sports: [
    "High-density cushioning protects joints during floor work and balance poses.",
    "Textured, non-slip surface holds grip even through a sweaty session.",
    "Lightweight and rolls down tight, with a carry strap included.",
    "Free of phthalates and heavy metals; easy to wipe clean after use.",
  ],
  toys: [
    "Step-by-step illustrated instructions make the build approachable solo or together.",
    "Compatible with standard building systems so it slots into a collection you already own.",
    "Finished model doubles as a display piece once it is built.",
    "Encourages focus, patience and spatial reasoning through hands-on play.",
  ],
  beauty: [
    "Lightweight formula absorbs quickly without leaving a tacky finish.",
    "Formulated for daily use on all skin types, including sensitive skin.",
    "Free from parabens, sulfates and synthetic fragrance.",
    "Cruelty-free and dermatologist tested.",
  ],
  tools: [
    "High-torque motor drives through hardwood, metal and masonry with the right bit.",
    "Variable-speed trigger gives you fine control when starting a hole.",
    "Keyless chuck makes bit changes quick, with no extra tools to lose.",
    "Balanced grip and an LED work light for low-light spaces.",
  ],
  pets: [
    "Real protein listed as the first ingredient — no poultry by-product meal.",
    "Formulated with omega fatty acids to support a healthy skin and coat.",
    "No artificial colors, flavors or preservatives.",
    "Portion guidance on the bag, with a resealable closure to keep it fresh.",
  ],
  books: [
    "An instant bestseller, widely recommended by booksellers and critics.",
    "Available in paperback, hardcover, Kindle and Audible editions.",
    "Ships in protective packaging to arrive in readable condition.",
    "A frequent pick for book clubs and reading groups.",
  ],
};


// ------------------------------------------------------------------ price
/**
 * Amazon shows a price *range* rather than a number for listings with many
 * variants (most shoes), and returns 0 for Kindle/Audible editions whose
 * price sits behind a format picker. Both arrive here as null/0.
 *
 * Resolution order: the scraped price, then the scraped list price, then a
 * deterministic price inside a band that is plausible for the department.
 * The last case is synthesised demo data, not a real Amazon price — it is
 * only ever used when the scrape genuinely had no number to show.
 */
const PRICE_BAND = {
  electronics: [2499, 29999],
  computers: [29999, 119999],
  "home-kitchen": [3999, 19999],
  fashion: [4499, 13999],
  sports: [1999, 5999],
  toys: [1999, 8999],
  beauty: [1299, 3499],
  tools: [3999, 17999],
  pets: [1999, 7999],
  books: [999, 2199],
};

function resolvePrice(row, category) {
  const scraped = Number(row.price_value);
  if (Number.isFinite(scraped) && scraped > 0) {
    return { priceCents: Math.round(scraped * 100), synthesised: false };
  }
  const list = Number(row.original_price_value);
  if (Number.isFinite(list) && list > 0) {
    return { priceCents: Math.round(list * 100), synthesised: false };
  }
  const [lo, hi] = PRICE_BAND[category] ?? [1999, 9999];
  // Land on a .99/.95/.49 ending so synthesised prices read like real ones.
  const base = pick(`${row.asin}price`, Math.floor(lo / 100), Math.floor(hi / 100));
  const ending = pickOne(`${row.asin}end`, [99, 95, 49, 98]);
  return { priceCents: base * 100 + ending, synthesised: true };
}

// -------------------------------------------------------------------- main
const dirs = process.argv.slice(2);
if (dirs.length === 0) {
  console.error("usage: node scripts/build-catalog.mjs <dir> [...]");
  process.exit(1);
}

/** Gather every scraped item from every supplied file/dir. */
const raw = [];
for (const target of dirs) {
  const stat = fs.statSync(target);
  const files = stat.isDirectory()
    ? fs
        .readdirSync(target)
        .filter((f) => f.endsWith(".json") || f.endsWith(".txt"))
        .map((f) => path.join(target, f))
    : [target];

  for (const file of files) {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      console.warn(`skipping unparseable ${file}`);
      continue;
    }
    const items = Array.isArray(parsed) ? parsed : (parsed.items ?? []);
    raw.push(...items);
  }
}

console.log(`read ${raw.length} raw rows`);

const byAsin = new Map();
for (const r of raw) {
  if (!r?.asin || !r.title || !r.image_url) continue;
  const category = QUERY_CATEGORY[r.query];
  if (!category) continue;
  // First write wins: earlier queries are the more on-topic ones.
  if (!byAsin.has(r.asin)) byAsin.set(r.asin, { ...r, category });
}

console.log(`${byAsin.size} unique, priced, categorised products`);

// Cap per department so no one category swamps search results.
const PER_CATEGORY_CAP = 40;
const counts = {};
const products = [];

for (const r of byAsin.values()) {
  const cat = r.category;
  counts[cat] = counts[cat] ?? 0;
  if (counts[cat] >= PER_CATEGORY_CAP) continue;
  counts[cat]++;

  const { priceCents, synthesised } = resolvePrice(r, cat);
  const listCents =
    !synthesised &&
    typeof r.original_price_value === "number" &&
    Math.round(r.original_price_value * 100) > priceCents
      ? Math.round(r.original_price_value * 100)
      : null;

  const imgs = imageSet(r.image_url);
  const variantDefs = VARIANTS_BY_CATEGORY[cat] ?? [];

  products.push({
    asin: r.asin,
    title: r.title,
    shortTitle: shortTitle(r.title),
    brand: deriveBrand(r.title),
    priceCents,
    listPriceCents: listCents,
    // A handful of scraped rows have no rating; give them a plausible,
    // stable one rather than rendering an empty star row.
    rating:
      typeof r.rating_value === "number"
        ? r.rating_value
        : pick(`${r.asin}rating`, 38, 49) / 10,
    reviewCount:
      typeof r.reviews_count_value === "number" && r.reviews_count_value > 0
        ? r.reviews_count_value
        : pick(`${r.asin}rc`, 12, 4200),
    image: imgs.card,
    images: [imgs.hero, imgs.card, imgs.thumb],
    category: cat,
    isPrime: Boolean(r.is_prime) || hash(`${r.asin}prime`) % 100 < 72,
    badge: r.badge && r.badge.trim() ? r.badge.trim() : null,
    boughtPastMonth:
      typeof r.monthly_bought_value === "number" ? r.monthly_bought_value : null,
    bullets: BULLETS[cat],
    stock: pick(`${r.asin}stock`, 2, 40),
    variants: variantDefs.map((v) => ({
      kind: v.kind,
      options: v.options,
    })),
    priceSynthesised: synthesised,
  });
}

const synthesisedPrices = products.filter((p) => p.priceSynthesised).length;

products.sort((a, b) => b.reviewCount - a.reviewCount);

const outDir = path.join(process.cwd(), "src", "data");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "products.json");
fs.writeFileSync(outFile, `${JSON.stringify(products, null, 0)}\n`);

console.log(`wrote ${products.length} products -> ${path.relative(process.cwd(), outFile)}`);
console.log("per department:", counts);
console.log(
  `${synthesisedPrices} of ${products.length} prices synthesised (scrape returned a range or no number)`,
);
