import { expect, test } from "@playwright/test";

test("case shell shows the five investigation steps without invented results", async ({ page }) => {
  await page.goto("/");
  const panel = page.getByRole("region", { name: "Case panel", exact: true });
  await expect(panel.getByRole("heading", { level: 2 })).toHaveText([
    "Lead", "Scene", "Timeline", "Evidence", "Verdict",
  ]);
  await expect(panel.getByText("The Verdict will appear with the Evidence.")).toBeVisible();
  await expect(panel.getByText("Confirmed", { exact: true })).toHaveCount(0);

  for (const width of [1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.screenshot({ path: test.info().outputPath("case-panel.png"), fullPage: true });
});

test("case tabs support keyboard navigation and the partner empty state", async ({ page }) => {
  await page.goto("/");
  const caseTab = page.getByRole("tab", { name: "Case", exact: true });
  const partnerTab = page.getByRole("tab", { name: "Partner", exact: true });
  await caseTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(partnerTab).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(partnerTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("The partner is unavailable. You can still investigate your Case.")).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(caseTab).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Evidence", exact: true })).toBeVisible();
});
