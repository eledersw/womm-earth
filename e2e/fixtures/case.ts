// Shared browser setup for the shell and globe specs (Eleder's area).
// The HTTP API is answered from committed files, so these specs test the UI,
// not the live NASA POWER service or the statistics engine.
import { expect, type Page } from "@playwright/test";
import variables from "../../api/_fixtures/variables.json";
import catalog from "../../api/_data/regions.json";

export async function mockApi(page: Page) {
  await page.route("**/api/py/variables", (route) => route.fulfill({ json: variables }));
  await page.route("**/api/py/regions", (route) => route.fulfill({ json: catalog }));
  await page.route("**/api/py/trendmap**", (route) => route.fulfill({ json: { variable: "T2M", start: 2002, end: 2025, season: "JJA", entries: {} } }));
  await page.route("**/api/partner", (route) => route.fulfill({ status: 503, body: "" }));
}

/** Open a case from its URL query and wait until the app is interactive. */
export async function openCase(page: Page, query = "") {
  await mockApi(page);
  await page.goto(query ? `/?${query}` : "/");
  await expect(page.getByRole("button", { name: "Investigate", exact: true })).toBeVisible({ timeout: 20_000 });
}

/** Search for a place and add it. Retries the open, since the first click can land before hydration. */
export async function addBySearch(page: Page, name: string) {
  const trigger = page.getByRole("button", { name: "Find a place", exact: true });
  const input = page.getByPlaceholder("Country, US state, ocean or region…");
  await expect(async () => {
    if (!(await input.isVisible())) await trigger.click();
    await expect(input).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 20_000 });
  await input.fill(name);
  await page.getByRole("option", { name: new RegExp(`^${name}\\b`) }).first().click();
}

export const regionsInUrl = (page: Page) => new URL(page.url()).searchParams.get("r")?.split(",") ?? [];
