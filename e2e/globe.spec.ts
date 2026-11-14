import { expect, test } from "@playwright/test";
import { addBySearch, openCase, regionsInUrl } from "./fixtures/case";

// The globe is WebGL; headless Chromium draws it in software, which is slow.
test.describe.configure({ timeout: 90_000 });

test("search adds a region to the URL", async ({ page }) => {
  await openCase(page, "v=T2M&from=2002&to=2025&s=JJA");
  await addBySearch(page, "Wisconsin");
  await expect.poll(() => regionsInUrl(page)).toEqual(["US-WI"]);
});

test("a share link restores the same case after reload", async ({ page }) => {
  const query = "v=T2M&r=US-WI,ESP&from=2002&to=2024&s=JJA";
  await openCase(page, query);
  await page.reload();
  await expect(page.getByRole("button", { name: "Investigate", exact: true })).toBeVisible({ timeout: 20_000 });
  const scene = page.locator('[data-case-step="scene"]');
  await expect(scene.getByText("Wisconsin (US-WI)", { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(scene.getByText("Spain (ESP)", { exact: true })).toBeVisible({ timeout: 20_000 });
  // Regions keep their order: it decides each region's pen colour.
  expect(regionsInUrl(page)).toEqual(["US-WI", "ESP"]);
  const params = new URL(page.url()).searchParams;
  expect([params.get("from"), params.get("to"), params.get("s")]).toEqual(["2002", "2024", "JJA"]);
});

test("a fifth region is refused with a message", async ({ page }) => {
  await openCase(page, "v=T2M&r=US-WI,ESP,FRA,DEU&from=2002&to=2025&s=JJA");
  await addBySearch(page, "Italy");
  await expect(page.getByText("Four regions is the limit. Remove one to add another.")).toBeVisible();
  expect(regionsInUrl(page)).toEqual(["US-WI", "ESP", "FRA", "DEU"]);
});
