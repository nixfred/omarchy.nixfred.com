/**
 * Renders scripts/og-card.html to site/assets/img/og.png (1200x630), the image
 * every link preview shows, and rebuilds the favicon PNGs from favicon.svg.
 *
 *   bun scripts/og.ts
 *
 * Chromium is the system one; Playwright's own download is not installed here.
 */
import { chromium } from "playwright";
import { $ } from "bun";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = `${ROOT}site/assets/img`;

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium" });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.goto(`file://${ROOT}scripts/og-card.html`, { waitUntil: "networkidle" });

// fetch() is blocked on file:// URLs, so the wordmark and the live figures are
// injected here rather than pulled by the page. Keeping them out of the markup
// is what stops the card drifting from the catalogue it advertises.
const wordmark = await Bun.file(`${OUT}/omarchy-wordmark.svg`).text();
const stats = (await Bun.file(`${ROOT}site/data.json`).json()).stats;
await page.evaluate(
  ({ wordmark, stats }) => {
    document.getElementById("mark")!.innerHTML = wordmark;
    document.getElementById("n-plugins")!.textContent = String(stats.plugins);
    document.getElementById("n-stars")!.textContent = String(stats.stars);
    document.getElementById("n-fam")!.textContent = String(stats.families);
  },
  { wordmark, stats },
);
// The webfont and the three screenshots all load async; a short settle beats a
// race with document.fonts.ready, which resolves before the images paint.
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/og.png` });
await browser.close();
console.log(`✓ ${OUT}/og.png`);

// Favicons. An SVG icon covers every modern browser, but Safari's pinned tabs,
// older Android and every link unfurler that refuses SVG need raster too.
for (const size of [32, 180, 512]) {
  const name = size === 180 ? "apple-touch-icon.png" : `favicon-${size}.png`;
  await $`magick -background none -density 384 ${OUT}/favicon.svg -resize ${size}x${size} ${OUT}/${name}`.quiet();
  console.log(`✓ ${OUT}/${name}`);
}
