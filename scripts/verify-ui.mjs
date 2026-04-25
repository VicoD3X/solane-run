import { chromium, expect } from "@playwright/test";

const baseUrl = "http://127.0.0.1:5173";

const browser = await chromium.launch({ headless: true });

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto(baseUrl, { waitUntil: "networkidle" });
  await desktop.evaluate(() => document.fonts.ready);

  await expect(desktop).toHaveTitle("Solane Run");
  await expect(desktop.getByRole("link", { name: "Solane Run dashboard" })).toBeVisible();
  await expect(desktop.getByText("Freight parameters")).toBeVisible();
  await expect(desktop.getByText("Route Overview")).toBeVisible();
  await expect(desktop.getByText("Quote Summary")).toBeVisible();
  await expect(desktop.getByText("BETA")).toBeVisible();
  await expect(desktop.getByText(/pilots/i)).toBeVisible({ timeout: 15000 });
  await expect(desktop.getByText("Public ESI Route")).toHaveCount(0);
  await expect(desktop.getByText("History")).toHaveCount(0);
  await expect(desktop.getByText("Public-only ESI scope")).toHaveCount(0);
  await expect(desktop.getByText("Demo pricing model")).toHaveCount(0);

  await desktop.getByLabel("Destination").selectOption("Dodixie");
  await desktop.getByRole("button", { name: "Insecure" }).click();
  await desktop.getByLabel("Volume").fill("520000");
  await desktop.getByLabel("Collateral").fill("2200000000");
  await desktop.getByRole("button", { name: "Calculate Run" }).click();
  await expect(desktop.getByText(/Public ESI route synced/i)).toBeVisible({ timeout: 15000 });
  await desktop.getByRole("button", { name: /Saved Quotes/i }).click();
  await expect(desktop.getByRole("button", { name: /Saved Quotes: coming soon/i })).toContainText(
    /Coming soon/,
  );
  await expect(desktop.getByRole("button", { name: /Saved Quotes/i })).toContainText(/Saved Quotes/, {
    timeout: 3000,
  });

  const desktopOverflow = await desktop.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (desktopOverflow > 1) {
    throw new Error(`Desktop horizontal overflow detected: ${desktopOverflow}px`);
  }
  await desktop.screenshot({ path: "dev.logs/desktop.png", fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(baseUrl, { waitUntil: "networkidle" });
  await mobile.evaluate(() => document.fonts.ready);
  await expect(mobile.getByRole("link", { name: "Solane Run dashboard" })).toBeVisible();
  await expect(mobile.getByText("Freight parameters")).toBeVisible();
  await expect(mobile.getByText("Route Overview")).toBeVisible();
  await expect(mobile.getByText("Quote Summary")).toBeVisible();

  const mobileOverflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (mobileOverflow > 1) {
    throw new Error(`Mobile horizontal overflow detected: ${mobileOverflow}px`);
  }
  await mobile.screenshot({ path: "dev.logs/mobile.png", fullPage: true });
} finally {
  await browser.close();
}
