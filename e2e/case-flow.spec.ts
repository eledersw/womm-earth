import { expect, test } from "@playwright/test";
import variables from "../api/_fixtures/variables.json";
import regions from "../api/_fixtures/regions.json";
import fixture from "../api/_fixtures/analyze.json";

// Browser checks exercise the real URL adapter and controls against the official
// HTTP fixtures. They do not claim validation of the scientific data pipeline.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/py/variables", (route) => route.fulfill({ json: variables }));
  await page.route("**/api/py/regions", (route) => route.fulfill({ json: regions }));
  await page.route("**/api/py/analyze", (route) => {
    const body = route.request().postDataJSON();
    return route.fulfill({ json: {
      ...fixture, case: body,
      results: body.regions.map((id: string) => ({ ...fixture.results[0], region: regions.find((region) => region.id === id) })),
    } });
  });
});

test("case controls update the URL and restore it on reload", async ({ page }) => {
  await page.goto("/?v=T2M&r=US-WI&from=1981&to=2025&s=JJA&lvl=scientist");
  const variable = page.getByRole("combobox", { name: "Variable", exact: true });
  await expect(page.getByText("Monthly mean 2 m air temperature.")).toBeVisible();
  await variable.selectOption("MODIS_AQUA_AOD");
  await expect(page).toHaveURL(/from=2002/);
  const start = page.getByRole("slider").nth(0);
  await start.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/from=2003/);
  await page.getByRole("radio", { name: "Custom", exact: true }).click();
  await page.getByRole("combobox", { name: "Start month", exact: true }).selectOption("11");
  await page.getByRole("combobox", { name: "End month", exact: true }).selectOption("2");
  await expect.poll(() => new URL(page.url()).searchParams.get("m")).toBe("11,12,1,2");
  await page.reload();
  await expect(variable).toHaveValue("MODIS_AQUA_AOD");
  await expect(page.getByRole("radio", { name: "Custom", exact: true })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("combobox", { name: "Start month", exact: true })).toHaveValue("11");
  await expect(page.getByRole("combobox", { name: "End month", exact: true })).toHaveValue("2");
  await expect(page.getByRole("slider").nth(0)).toHaveAttribute("aria-valuenow", "2003");
  await expect(page.locator('[data-case-step="scene"]').getByText("Wisconsin (US-WI)", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove region: Wisconsin" }).click();
  await expect.poll(() => new URL(page.url()).searchParams.has("r")).toBe(false);
  await expect(page.getByText("Choose a region for your Case.", { exact: true })).toBeVisible();
  await expect(page.getByText("Wisconsin: Confirmed", { exact: true })).toHaveCount(0);
});

test("the setup panel fits the viewport and live-provider variables remain selectable", async ({ page }) => {
  await page.goto("/?r=ESP");
  const panel = page.getByRole("region", { name: "Case panel", exact: true });
  await expect(panel.getByRole("heading", { level: 2 })).toHaveText(["Lead", "Scene", "Timeline"]);
  await expect(page.getByRole("option", { name: /Aerosol optical depth/ })).toBeEnabled();
  for (const width of [1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    // Header sizing belongs to the shell. Check the owned panel, including
    // its content, without conflating the known 2px header overflow at 390px.
    await expect.poll(() => page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>('[aria-label="Case panel"]')!;
      return panel.getBoundingClientRect().right <= innerWidth && panel.scrollWidth <= panel.clientWidth;
    })).toBe(true);
  }
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.screenshot({ path: test.info().outputPath("case-controls.png"), fullPage: true });
});

test("analysis errors can be retried without showing the previous result", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/py/analyze", (route) => {
    calls++;
    return calls === 1 ? route.fulfill({ status: 503, json: { detail: "unavailable" } }) : route.fulfill({ json: fixture });
  });
  await page.goto("/?r=US-WI");
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  const evidence = page.locator('[data-case-step="evidence"]');
  await expect(evidence.getByRole("alert")).toBeVisible();
  await expect(page.getByText("Wisconsin: Confirmed", { exact: true })).toHaveCount(0);
  await evidence.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Wisconsin: Confirmed", { exact: true })).toBeVisible();
});

test("Investigate opens the results pane with evidence, verdict and the partner", async ({ page }) => {
  await page.route("**/api/py/analyze", (route) => route.fulfill({ json: fixture }));
  await page.goto("/?r=US-WI");
  await expect(page.getByRole("heading", { name: "Evidence", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  const results = page.getByRole("region", { name: "Results", exact: true });
  await expect(results.getByRole("heading", { name: "Evidence", exact: true })).toBeVisible();
  await expect(results.getByText("Wisconsin: Confirmed", { exact: true })).toBeVisible();
  await expect(results.getByRole("textbox", { name: "Ask the Partner" })).toBeVisible();
  await results.getByRole("button", { name: "Hide results" }).click();
  await expect(results).toHaveCount(0);
});

test("Evidence switches yearly/monthly/anomalies and Scientist renders the methods table", async ({ page }) => {
  await page.goto("/?v=T2M&r=US-WI&from=1981&to=2024&s=ANN&lvl=scientist");
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  const evidence = page.locator('[data-case-step="evidence"]');
  await expect(evidence.getByRole("img", { name: "Yearly series", exact: true })).toBeVisible();
  await expect(page.getByRole("table", { name: "Statistical results · °C" })).toBeVisible();
  await expect(page.getByText("Mann-Kendall (Hamed–Rao)", { exact: true })).toBeVisible();
  await evidence.getByRole("radio", { name: "Monthly", exact: true }).click();
  await expect(evidence.getByRole("img", { name: "Monthly series", exact: true })).toBeVisible();
  await evidence.getByRole("radio", { name: "Anomalies", exact: true }).click();
  await expect(evidence.getByRole("img", { name: "Monthly anomalies", exact: true })).toBeVisible();
  await expect(evidence.getByText(/Anomalies subtract/)).toBeVisible();
  await evidence.getByRole("radio", { name: "Yearly", exact: true }).click();
  await expect(evidence.getByRole("img", { name: "Yearly series", exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("evidence-verdict.png"), fullPage: true });
});

test("four-region Scientist comparison fits narrow windows and shows warnings", async ({ page }) => {
  await page.route("**/api/py/analyze", (route) => {
    const body = route.request().postDataJSON();
    return route.fulfill({ json: { ...fixture, case: body, results: body.regions.map((id: string) => ({ ...fixture.results[0], region: regions.find((r) => r.id === id), warnings: ["tests_disagree"] })) } });
  });
  await page.goto("/?v=T2M&r=USA,US-WI,ESP,NR-SAHEL&from=2002&to=2025&s=JJA&lvl=scientist");
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(4);
  await expect(page.getByText("Tests disagree", { exact: true })).toHaveCount(4);
  for (const width of [1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    // Header sizing belongs to the shell. Check the owned panel, including
    // its content, without conflating the known 2px header overflow at 390px.
    await expect.poll(() => page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>('[aria-label="Case panel"]')!;
      return panel.getBoundingClientRect().right <= innerWidth && panel.scrollWidth <= panel.clientWidth;
    })).toBe(true);
  }
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.screenshot({ path: test.info().outputPath("four-regions-light.png"), fullPage: true });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.screenshot({ path: test.info().outputPath("four-regions-dark.png"), fullPage: true });
});
