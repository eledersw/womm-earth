import { expect, test } from "@playwright/test";

test("the landing page leads to the app with one obvious Launch App button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Read the Planet.");
  const launch = page.getByRole("main").getByRole("link", { name: "Launch App" }).first();
  await expect(launch).toBeVisible();
  await expect(launch).toHaveAttribute("href", "/app");
  await expect(page.getByRole("link", { name: /GitHub/ }).first()).toHaveAttribute("href", "https://github.com/eledersw/womm-earth");
  await expect(page.getByRole("heading", { name: "Team WOMM." })).toBeVisible();
});

test("share links made before the move still open the case in the app", async ({ page }) => {
  await page.route("**/api/py/**", (route) => route.fulfill({ json: [] }));
  await page.goto("/?v=T2M&r=ESP");
  await expect.poll(() => new URL(page.url()).pathname).toBe("/app");
  expect(new URL(page.url()).searchParams.get("r")).toBe("ESP");
});
