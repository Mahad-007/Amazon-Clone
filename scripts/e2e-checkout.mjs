/**
 * Full purchase flow against the real Supabase project: guest cart ->
 * register -> cart merge -> checkout -> order detail -> orders list ->
 * review -> sign out -> sign back in and confirm the order persisted.
 */
import { chromium } from "playwright-core";

/**
 * Resolve Chromium without hardcoding a machine-specific path: honour
 * CHROME_PATH when set (CI, or a system browser), otherwise use the binary
 * Playwright downloaded into its own cache.
 */
const EXE = process.env.CHROME_PATH || chromium.executablePath();

const BASE = process.env.BASE_URL ?? "http://localhost:3100";

const email = `e2e+${Date.now()}@example.com`;
const password = "hunter2pass";

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();

const failures = [];
const log = [];
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));

function check(name, ok, detail = "") {
  const line = `${ok ? "  PASS" : "  FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`;
  // Stream results: a later step can throw, and the earlier verdicts are
  // exactly what you need to diagnose it.
  console.log(line);
  log.push(line);
  if (!ok) failures.push(name);
}

/**
 * Wait for the header badge to reach a value rather than sleeping a fixed
 * amount. A cold serverless function can take a few seconds on the first
 * interaction, which made fixed waits flaky against production.
 */
async function waitForBadge(page, want, timeout = 25000) {
  try {
    await page.waitForFunction(
      (w) =>
        [...document.querySelectorAll('a[aria-label^="Shopping cart"] span')]
          .some((s) => s.textContent.trim() === String(w)),
      want,
      { timeout },
    );
    return true;
  } catch {
    return false;
  }
}

const badge = async () =>
  Number((await page.locator('a[aria-label^="Shopping cart"] span').first().textContent()) || 0);

// 1. Build a cart as a guest.
await page.goto(`${BASE}/product/B0DBF65JYY`, { waitUntil: "networkidle" });
await page.click('button:has-text("Add to Cart")');
await waitForBadge(page, 1);
check("guest cart has an item", (await badge()) === 1, `badge=${await badge()}`);

// 2. Checkout should bounce an anonymous visitor to sign-in.
await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
check("checkout redirects anonymous users", new URL(page.url()).pathname === "/signin", page.url());

// 3. Register.
await page.goto(`${BASE}/register?next=/checkout`, { waitUntil: "networkidle" });
await page.fill('input[name="name"]', "Test Shopper");
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', password);
await page.fill('input[name="confirm"]', password);
await page.click('main button:has-text("Create your Amazon account")');
await page.waitForURL((u) => new URL(u).pathname === "/checkout", { timeout: 25000 });
check("register lands on checkout", new URL(page.url()).pathname === "/checkout", page.url());

// 4. The guest cart must survive the sign-up.
check("guest cart merged into the account", (await badge()) === 1, `badge=${await badge()}`);

// 5. Place the order.
await page.fill('input[name="fullName"]', "Test Shopper");
await page.fill('input[name="line1"]', "410 Terry Ave N");
await page.fill('input[name="city"]', "Seattle");
await page.fill('input[name="state"]', "WA");
await page.fill('input[name="postalCode"]', "98109");
const totalText = (await page.locator("text=Order total").locator("..").textContent()) ?? "";
await page.click('button:has-text("Place your order")');
await page.waitForURL(/\/orders\//, { timeout: 25000 });
// The header re-renders from the revalidated layout; wait for the badge to
// actually clear rather than guessing how long that takes.
await waitForBadge(page, 0);
check("order confirmation shown",
  (await page.getByRole("heading", { name: /Order placed/ }).count()) === 1, page.url());
check("cart emptied after checkout", (await badge()) === 0, `badge=${await badge()}`);
check("order total carried through",
  ((await page.locator("text=Grand total").locator("..").textContent()) ?? "")
    .includes(totalText.match(/\$[\d.,]+/)?.[0] ?? "NOPE"),
  totalText.trim().slice(0, 40));

// 6. Orders list.
await page.goto(`${BASE}/orders`, { waitUntil: "networkidle" });
check("order appears in the orders list",
  (await page.locator("text=View order details").count()) >= 1);

// 7. Write a review as the signed-in user.
await page.goto(`${BASE}/product/B0DBF65JYY`, { waitUntil: "networkidle" });
await page.fill('input[placeholder="Add a headline"]', "Works as described");
await page.fill('textarea', "Bought this through the demo checkout and it arrived fine.");
await page.click('button:has-text("Submit review")');
await page.waitForTimeout(2000);
check("review submits", (await page.locator("text=your review has been posted").count()) === 1);
await page.reload({ waitUntil: "networkidle" });
check("review persists and is attributed",
  (await page.locator("text=Your review").count()) >= 1);

// 8. Sign out, sign back in, order still there.
await page.goto(`${BASE}/orders`, { waitUntil: "networkidle" });
await ctx.clearCookies();
await page.goto(`${BASE}/signin?next=/orders`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', password);
await page.click('main button:has-text("Sign in")');
await page.waitForURL((u) => new URL(u).pathname.startsWith("/orders"), { timeout: 25000 });
check("order survives sign-out and sign-in",
  (await page.locator("text=View order details").count()) >= 1, page.url());

await browser.close();
if (errors.length) console.log("\npage errors:\n  " + errors.join("\n  "));
console.log(failures.length ? `\n${failures.length} FAILURE(S): ${failures.join(", ")}` : "\nall checks passed");
console.log(`\ntest account: ${email}`);
process.exit(failures.length ? 1 : 0);
