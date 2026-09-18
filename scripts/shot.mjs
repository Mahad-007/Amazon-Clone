/**
 * Dev-only screenshot harness. Drives the local dev server with the Chromium
 * that Playwright already cached, captures each route, and reports any
 * console or page errors — the fastest way to check a UI change actually
 * renders rather than merely returning 200.
 *
 * Usage: node scripts/shot.mjs '[{"name":"home","path":"/"}]'
 */
import { chromium } from "playwright-core";

/**
 * Resolve Chromium without hardcoding a machine-specific path: honour
 * CHROME_PATH when set (CI, or a system browser), otherwise use the binary
 * Playwright downloaded into its own cache.
 */
const EXE = process.env.CHROME_PATH || chromium.executablePath();
import fs from "node:fs";

const OUT = process.env.SHOT_DIR ?? "./.shots";
const BASE = process.env.BASE_URL ?? "http://localhost:3100";

fs.mkdirSync(OUT, { recursive: true });

const targets = JSON.parse(process.argv[2] ?? "[]");
const browser = await chromium.launch({ executablePath: EXE });
const problems = [];

for (const t of targets) {
  const page = await browser.newPage({
    viewport: { width: t.w ?? 1440, height: t.h ?? 900 },
  });

  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`[${t.name}] ${m.text().slice(0, 220)}`);
  });
  page.on("pageerror", (e) =>
    problems.push(`[${t.name}] PAGEERROR ${e.message.slice(0, 220)}`),
  );

  try {
    await page.goto(`${BASE}${t.path}`, {
      waitUntil: t.until ?? "networkidle",
      timeout: 45000,
    });
    if (t.click) await page.click(t.click);
    if (t.fill) {
      for (const [sel, val] of Object.entries(t.fill)) await page.fill(sel, val);
    }
    if (t.submit) await page.click(t.submit);
    if (t.wait) await page.waitForTimeout(t.wait);

    await page.screenshot({
      path: `${OUT}/${t.name}.png`,
      fullPage: t.full ?? false,
    });
    console.log(`  ✓ ${t.name.padEnd(22)} ${t.path}`);
  } catch (err) {
    problems.push(`[${t.name}] NAV ${String(err).slice(0, 220)}`);
    console.log(`  ✗ ${t.name.padEnd(22)} ${t.path}`);
  }

  await page.close();
}

await browser.close();
console.log(problems.length ? `\nPROBLEMS:\n${problems.join("\n")}` : "\nno console/page errors");
