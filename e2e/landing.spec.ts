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

test("the submission video page plays the video with sound", async ({ page }) => {
  await page.goto("/video");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("WOMM Earth in thirty seconds.");
  const video = page.locator("video");
  await expect(video).toHaveAttribute("src", "/media/womm-earth-video.mp4");
  expect(await video.evaluate((el: HTMLVideoElement) => el.muted)).toBe(false);
  const res = await page.request.get("/media/womm-earth-video.mp4", { headers: { Range: "bytes=0-1023" } });
  expect([200, 206]).toContain(res.status());
});
