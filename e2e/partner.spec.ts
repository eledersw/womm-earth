import { expect, test, type Route } from "@playwright/test";
import variables from "../api/_fixtures/variables.json";
import regions from "../api/_fixtures/regions.json";
import fixture from "../api/_fixtures/analyze.json";
const sse = (text: string) => `data: ${JSON.stringify({ type: "text", text })}\n\ndata: {"type":"done"}\n\n`;
test.beforeEach(async ({ page }) => {
  await page.route("**/api/py/variables", (route) => route.fulfill({ json: variables }));
  await page.route("**/api/py/regions", (route) => route.fulfill({ json: regions }));
  await page.route("**/api/py/analyze", (route) => route.fulfill({ json: fixture }));
});
test("Explain failure keeps the template verdict and supports retry", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/partner", (route) => {
    requests++;
    return route.fulfill({ contentType: "text/event-stream", body: requests === 1 ? 'data: {"type":"error","message":"Unavailable"}\n\ndata: {"type":"done"}\n\n' : sse("Mann-Kendall detects a trend, p = 0.01.") });
  });
  await page.goto("/?r=US-WI&from=2002&to=2025&s=JJA");
  await expect(page.getByRole("heading", { name: "Wisconsin: Confirmed" })).toBeVisible();
  const box = page.getByRole("region", { name: "Explain this verdict" });
  await expect(box.getByRole("alert")).toBeVisible();
  await box.getByRole("button", { name: "Retry explanation" }).click();
  await expect(box.getByText("Mann-Kendall detects a trend, p = 0.01.", { exact: true })).toBeVisible();
  await expect(box.getByText("Draft explanation · being checked")).toHaveCount(0);
});
test("reading-level changes abort stale explanations and update the URL", async ({ page }) => {
  const held: Route[] = [];
  await page.route("**/api/partner", (route) => {
    if (route.request().postDataJSON().level === "student") { held.push(route); return; }
    return route.fulfill({ contentType: "text/event-stream", body: sse("Scientist explanation.") });
  });
  await page.goto("/?r=US-WI&from=2002&to=2025");
  await expect.poll(() => held.length).toBe(1);
  await page.getByRole("radio", { name: "Scientist", exact: true }).click();
  await expect(page).toHaveURL(/lvl=scientist/);
  await expect(page.getByText("Scientist explanation.", { exact: true })).toBeVisible();
  await held[0].fulfill({ contentType: "text/event-stream", body: sse("Stale Student explanation.") }).catch(() => {});
  await expect(page.getByText("Stale Student explanation.", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("table")).toBeVisible();
});
test("too-short verdicts do not request explanations", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/py/analyze", (route) => route.fulfill({ json: { ...fixture, results: [{ ...fixture.results[0], stats: null, verdict: { tier: "too_short", years_needed: null, reason: null } }] } }));
  await page.route("**/api/partner", (route) => { requests++; return route.fulfill({ contentType: "text/event-stream", body: sse("Unexpected") }); });
  await page.goto("/?r=US-WI");
  await expect(page.getByRole("heading", { name: "Wisconsin: Too short to judge" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Explain this verdict" })).toHaveCount(0);
  expect(requests).toBe(0);
});
test("Stop cancels an in-flight explanation and permits retry", async ({ page }) => {
  const held: Route[] = [];
  await page.route("**/api/partner", (route) => { held.push(route); });
  await page.goto("/?r=US-WI");
  await expect.poll(() => held.length).toBe(1);
  const box = page.getByRole("region", { name: "Explain this verdict" });
  await box.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(box.getByText("Explanation stopped.", { exact: true })).toBeVisible();
  await held[0].fulfill({ contentType: "text/event-stream", body: sse("Stale explanation") }).catch(() => {});
  await box.getByRole("button", { name: "Retry explanation" }).click();
  await expect.poll(() => held.length).toBe(2);
  await held[1].fulfill({ contentType: "text/event-stream", body: sse("Retried explanation.") });
  await expect(box.getByText("Retried explanation.", { exact: true })).toBeVisible();
  await expect(box.getByText("Stale explanation", { exact: true })).toHaveCount(0);
});
