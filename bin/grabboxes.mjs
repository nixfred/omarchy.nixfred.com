#!/usr/bin/env node
/**
 * Scrape every copy box from the rendered page, exactly as a visitor copies it.
 *
 *   node bin/grabboxes.mjs [url] > boxes.json
 *
 * Lives in the repo, not a scratchpad: the scratchpad copy was wiped twice, and
 * the second time bin/provecommands ran on nothing and reported success.
 * Every <details> is forced open first, because the Install and Clone boxes sit
 * inside collapsed dropdowns and do not exist in the DOM until then.
 */
import { chromium } from "playwright";

const url = process.argv[2] ?? "https://omarchy.nixfred.com/";
const b = await chromium.launch({ executablePath: "/usr/bin/chromium" });
const p = await b.newPage();
await p.goto(url, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
await p.waitForTimeout(1200);
const rows = await p.evaluate(() =>
  [...document.querySelectorAll(".cmd-row")].map((r) => ({
    label: r.querySelector(".cmd-label")?.textContent.trim(),
    code: r.querySelector("code")?.textContent,
    attr: r.querySelector(".cmd-box")?.getAttribute("data-cmd"),
    card:
      r.closest("article")?.querySelector("h3")?.textContent.trim() ||
      r.closest(".theme-card")?.querySelector("h3")?.textContent.trim() ||
      "?",
  })),
);
await b.close();
if (!rows.length) {
  console.error("grabboxes: found ZERO copy boxes — the page did not render");
  process.exit(2);
}
process.stdout.write(JSON.stringify(rows));
