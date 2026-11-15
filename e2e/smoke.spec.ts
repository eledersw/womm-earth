import { expect, test } from "@playwright/test";
import { openCase } from "./fixtures/case";

test("home loads with the WOMM Earth shell", async ({ page }) => {
  await openCase(page);
  await expect(page.getByRole("link", { name: "WOMM Earth" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Share case" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Gaia · explain & ask" })).toBeVisible();
});

test("the API answers its health check", async ({ request }) => {
  const res = await request.get("/api/py/health");
  expect(res.ok()).toBe(true);
});
