// Captures README / portfolio screenshots. Usage: start the app, then `node scripts/screenshot.mjs [baseUrl]`
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
mkdirSync("docs", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });

await page.goto(`${base}/register`);
await page.getByLabel("Name").fill("Demo");
await page.getByLabel("Email").fill(`demo-${Date.now()}@example.test`);
await page.getByLabel("Password").fill("demo-password-123");
await page.getByRole("button", { name: "Sign up" }).click();
await page.waitForURL("**/book");

const d = new Date();
d.setDate(d.getDate() + 3);
if (d.getDay() === 0) d.setDate(d.getDate() + 1);
const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade" }).format(d);

await page.getByRole("button", { name: /^Haircut \+ beard/ }).click();
await page.getByLabel("Date").fill(date);
const times = page.getByRole("group", { name: "Available times" }).getByRole("button");
await times.nth(5).click();
await page.mouse.move(0, 0);
await page.waitForTimeout(500); // let CSS transitions finish
await page.screenshot({ path: "docs/screenshot.png" });

await page.goto(`${base}/`);
await page.screenshot({ path: "docs/home.png" });

await browser.close();
console.log("saved docs/screenshot.png, docs/home.png");
