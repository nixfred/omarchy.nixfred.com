import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.env.URL || "http://localhost:4720/?noboot=1";
const out = "scripts/verify-out";
await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text());
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
const boot = page.locator(".boot");
if (await boot.count()) {
  await page.keyboard.press("Escape");
}
await page.waitForSelector(".bar", { timeout: 15000 });
await page.waitForSelector(".os-window", { timeout: 10000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/01-desktop.png` });

const bar = await page.locator(".bar").count();
const wins = await page.locator(".os-window").count();
const wordmark = await page.locator(".wordmark").innerText();

// type a command in the terminal
const term = page.locator(".term input");
await term.click();
await term.fill("omarchy theme set gruvbox");
await term.press("Enter");
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/02-theme-gruvbox.png` });
const theme = await page.locator("html").getAttribute("data-theme");

// launcher
await page.keyboard.press("Alt+Space");
await page.waitForTimeout(300);
const launcher = await page.locator(".palette").count();
await page.screenshot({ path: `${out}/03-launcher.png` });
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

// cheatsheet
await page.keyboard.press("Alt+k");
await page.waitForTimeout(300);
const cheat = await page.locator(".cheatsheet").count();
await page.screenshot({ path: `${out}/04-cheatsheet.png` });
await page.keyboard.press("Escape");

// lock
await page.keyboard.press("Alt+Control+l");
await page.waitForTimeout(400);
const lock = await page.locator(".lock").count();
await page.screenshot({ path: `${out}/05-lock.png` });
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

// workspace 2 empty then back
await page.keyboard.press("Alt+2");
await page.waitForTimeout(200);
const ws2wins = await page.locator(".os-window").count();
await page.keyboard.press("Alt+1");
await page.waitForTimeout(200);

console.log(JSON.stringify({ bar, wins, wordmark, theme, launcher, cheat, lock, ws2wins, errors }, null, 2));
if (bar !== 1) throw new Error("no bar");
if (wins < 1) throw new Error("no windows");
if (theme !== "gruvbox") throw new Error("theme not applied: " + theme);
if (!launcher) throw new Error("launcher did not open");
if (!cheat) throw new Error("cheatsheet did not open");
if (!lock) throw new Error("lock did not open");
if (errors.length) throw new Error("page errors: " + errors.join(" | "));
await browser.close();
console.log("OK");
