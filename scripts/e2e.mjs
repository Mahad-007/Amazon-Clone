/**
 * End-to-end smoke test for the shopping flow. Not a replacement for a real
 * test suite — it is a fast way to prove the server actions, cookies and
 * Supabase writes actually work in a browser before shipping.
 */
import { chromium } from "playwright-core";

const EXE =
  process.env.CHROME_PATH ??
  "/home/maddy/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";
const BASE = process.env.BASE_URL ?? "http://localhost:3100";

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const failures = [];
const log = [];
function check(name, ok, detail = "") {
  log.push(`${ok ? "  PASS" : "  FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(name);
}

async function cartBadge() {
  return Number((await page.locator('a[aria-label^="Shopping cart"] span').first().textContent()) || 0);
}

// ---------------------------------------------------------------- guest cart
await page.goto(`${BASE}/product/B0DBF65JYY`, { waitUntil: "networkidle" });
check("PDP loads", (await page.locator("h1").first().textContent())?.includes("medicube"));
check("cart starts empty", (await cartBadge()) === 0, `badge=${await cartBadge()}`);

await page.click('button:has-text("Add to Cart")');
await page.waitForTimeout(1200);
check("badge increments after add", (await cartBadge()) === 1, `badge=${await cartBadge()}`);

// Add a different product, with quantity 3.
await page.goto(`${BASE}/product/B00NHQF6MG`, { waitUntil: "networkidle" });
await page.getByLabel("Quantity").selectOption("3");
await page.click('button:has-text("Add to Cart")');
await page.waitForTimeout(1200);
check("badge sums quantities", (await cartBadge()) === 4, `badge=${await cartBadge()}`);

// ------------------------------------------------------------------- cart UI
await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
const rows = await page.locator("main ul > li").count();
check("cart lists both items", rows >= 2, `rows=${rows}`);
const subtotalText = (await page.locator("text=/Subtotal \\(4 items\\)/").first().textContent()) ?? "";
check("subtotal shows 4 items", subtotalText.includes("4 items"), subtotalText.trim());

// Save for later moves the line out of the active cart.
await page.click('button:has-text("Save for later")');
await page.waitForTimeout(1200);
check("save for later creates saved section",
  (await page.locator('h2:has-text("Saved for later")').count()) === 1);

await page.click('button:has-text("Move to cart")');
await page.waitForTimeout(1200);
check("move to cart restores the line", (await cartBadge()) === 4, `badge=${await cartBadge()}`);

// Delete empties one line.
await page.click('button:has-text("Delete")');
await page.waitForTimeout(1200);
const after = await cartBadge();
check("delete reduces the cart", after < 4, `badge=${after}`);

// ---------------------------------------------------- persistence via cookie
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
check("cart survives navigation", (await cartBadge()) === after, `badge=${await cartBadge()}`);

const fresh = await browser.newContext();
const freshPage = await fresh.newPage();
await freshPage.goto(`${BASE}/`, { waitUntil: "networkidle" });
const freshBadge = Number((await freshPage.locator('a[aria-label^="Shopping cart"] span').first().textContent()) || 0);
check("a different browser has its own cart", freshBadge === 0, `badge=${freshBadge}`);

await browser.close();
console.log(log.join("\n"));
console.log(failures.length ? `\n${failures.length} FAILURE(S): ${failures.join(", ")}` : "\nall checks passed");
process.exit(failures.length ? 1 : 0);
