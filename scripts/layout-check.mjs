/**
 * Mobile layout audit: loads each path at a phone width and reports
 * horizontal overflow (the page wider than the viewport) and images that
 * failed to load. Deliberately scrolling rows (.no-scrollbar, the ticker,
 * labelled product lists) are allowed to extend past the edge.
 *
 *   BASE_URL=http://localhost:3200 node scripts/layout-check.mjs / /s /deals
 */
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const WIDTH = Number(process.env.WIDTH ?? 390);
const paths = process.argv.slice(2).length ? process.argv.slice(2) : ["/"];

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || chromium.executablePath(),
});
let problems = 0;

for (const path of paths) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 844 } });
  await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 60000 });
  // Scroll through so lazy images get a chance to load before we judge them.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(800);

  const report = await page.evaluate((width) => {
    const allowed = (el) =>
      el.closest(".no-scrollbar, [aria-label*='discounts'], ul[aria-label], [data-allow-overflow]");
    const wide = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > width + 1 && !allowed(el)) {
        wide.push(`<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 70)}"> right=${Math.round(r.right)}`);
      }
    }
    const broken = [...document.images]
      .filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => i.src);
    return { scrollWidth: document.documentElement.scrollWidth, wide: wide.slice(0, 6), broken };
  }, WIDTH);

  const bad = report.scrollWidth > WIDTH || report.broken.length > 0;
  if (bad) problems++;
  console.log(`${bad ? "  FAIL" : "  PASS"}  ${path}  scrollWidth=${report.scrollWidth}`);
  for (const w of report.wide) console.log(`        overflow ${w}`);
  for (const b of report.broken) console.log(`        broken image ${b}`);
  await page.close();
}

await browser.close();
process.exit(problems ? 1 : 0);
