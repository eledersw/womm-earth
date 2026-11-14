import { expect, test } from "@playwright/test";
import variables from "../api/_fixtures/variables.json";
import regions from "../api/_fixtures/regions.json";
import fixture from "../api/_fixtures/analyze.json";
import regionCatalog from "../api/_data/regions.json";
// Legacy HTTP fixtures predate the [lng, lat] seam. Use the actual catalogue's
// centroid for camera checks without modifying Oier's fixture files.
const regionFixtures = regions.map((region) => ({ ...region, centroid: regionCatalog.find((item) => item.id === region.id)?.centroid ?? region.centroid }));

// Browser checks exercise the real URL adapter and controls against the official
// HTTP fixtures. They do not claim validation of the scientific data pipeline.
test.beforeEach(async ({ page }) => {
  // These tests exercise the panel. Globe geometry is covered by its owner.
  await page.route("**/geo/*.geojson", (route) => route.fulfill({ json: { type: "FeatureCollection", features: [] } }));
  await page.route("**/api/py/mirror", (route) => route.fulfill({ json: { base: { region: route.request().postDataJSON().regions[0], slope_per_decade: 0.8, p: 0.01, z: 2.5, tier: "confirmed" }, mirrors: [], none_found: true } }));
  await page.route("**/api/py/variables", (route) => route.fulfill({ json: variables }));
  await page.route("**/api/py/regions", (route) => route.fulfill({ json: regionFixtures }));
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
  await page.goto("/?v=T2M&r=US-WI&from=2002&to=2025&s=JJA&lvl=scientist");
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
    return route.fulfill({ json: { ...fixture, case: body, results: body.regions.map((id: string) => ({ ...fixture.results[0], region: regions.find((r) => r.id === id), stats: { ...fixture.results[0].stats, tests_agree: false, ols: { ...fixture.results[0].stats.ols, p: 0.1 } }, warnings: ["tests_disagree"] })) } });
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

test("predict gates evidence and explanations; correlation and mirrors use the active Case", async ({ page }) => {
  let explains = 0;
  const mirror = { base: { region: "US-WI", slope_per_decade: 0.8, p: 0.01, z: 2.5, tier: "confirmed" }, mirrors: [{ region: "NR-SAHEL", slope_per_decade: -0.4, p: 0.02, z: -2.4 }], none_found: false };
  await page.route("**/api/py/mirror", (route) => {
    expect(route.request().postDataJSON().regions).toEqual(["US-WI"]);
    return route.fulfill({ json: mirror });
  });
  await page.route("**/api/py/correlate", (route) => {
    const request = route.request().postDataJSON();
    expect(request.region).toBe("US-WI"); expect(request.max_lag).toBe(6);
    return route.fulfill({ json: { n: 24, n_eff: 20, pearson_raw: 0.68, pearson_detrended: 0.15, spearman_raw: 0.65, spearman_detrended: 0.12, p_raw: 0.01, p_detrended: 0.52, best_lag: 0, best_lag_r: 0.68,
      lags: [{ lag: -1, r: 0.4 }, { lag: 0, r: 0.68 }, { lag: 1, r: 0.5 }], scatter: [{ t: "2002-01", x: 1, y: 3 }, { t: "2002-02", x: 2, y: 4 }, { t: "2002-03", x: 3, y: 4 }], warning: "both_trending" } });
  });
  await page.route("**/api/partner", (route) => { explains++; return route.fulfill({ contentType: "text/event-stream", body: 'data: {"type":"error","message":"Unavailable"}\n\ndata: {"type":"done"}\n\n' }); });
  await page.goto("/?r=US-WI&from=2002&to=2025&s=JJA");
  await page.getByRole("checkbox", { name: "Predict before reveal" }).check();
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await expect(page.getByRole("button", { name: "Up", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wisconsin: Confirmed" })).toHaveCount(0);
  await expect(page.getByRole("figure", { name: "Yearly series" })).toHaveCount(0);
  expect(explains).toBe(0);
  await page.getByRole("button", { name: "Up", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wisconsin: Confirmed" })).toBeVisible();
  await expect(page.getByText(/You guessed Up; the data says Up/)).toBeVisible();
  await page.getByRole("combobox", { name: "Compare with another variable" }).selectOption("PRECTOTCORR");
  await expect(page.getByText("Both are trending, but that alone doesn't mean they're connected.")).toBeVisible();
  await expect(page.getByRole("img", { name: "Paired monthly anomalies", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show on globe", exact: true }).click();
  await expect(page.getByText("Mirror highlight requested on the globe.")).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("case-explorations.png"), fullPage: true });
  await page.getByRole("button", { name: "Compare Sahel", exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("r")).toBe("US-WI,NR-SAHEL");
});

test("current-Case guide navigates without analyzing and stays mounted across Investigate", async ({ page }) => {
  let analyses = 0;
  await page.route("**/api/py/analyze", (route) => { analyses++; return route.fulfill({ json: fixture }); });
  await page.goto("/?r=US-WI&from=2002&to=2025&s=JJA");
  const initial = new URL(page.url()).searchParams;
  await page.getByRole("button", { name: "Guide me through this Case", exact: true }).click();
  const guide = page.getByRole("region", { name: "Guided cases", exact: true });
  await expect(guide.getByText("Step 1 of 5", { exact: true })).toBeVisible();
  expect(analyses).toBe(0);
  await guide.getByRole("button", { name: "Next", exact: true }).click();
  await expect(guide.getByText("Step 2 of 5", { exact: true })).toBeVisible();
  await guide.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(guide.getByText("Step 1 of 5", { exact: true })).toBeVisible();
  await guide.getByRole("button", { name: "Play", exact: true }).click();
  await guide.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wisconsin: Confirmed" })).toBeVisible();
  await expect(guide.getByText("Step 1 of 5", { exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("current-case-guide.png"), fullPage: true });
  await guide.getByRole("button", { name: "Exit guide", exact: true }).click();
  await expect(guide.getByText("Step 1 of 5", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Guide me through this Case", exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("r")).toBe(initial.get("r"));
  expect(analyses).toBe(1);
});

test("case from URL shows verdict within ten seconds after Investigate", async ({ page }) => {
  await page.route("**/api/partner", (route) => route.fulfill({ contentType: "text/event-stream", body: 'data: {"type":"text","text":"Fixture explanation."}\n\ndata: {"type":"done"}\n\n' }));
  await page.goto("/?v=T2M&r=US-WI&from=1981&to=2024&s=ANN");
  await expect(page.getByRole("heading", { name: "Wisconsin: Confirmed" })).toHaveCount(0);
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wisconsin: Confirmed" })).toBeVisible({ timeout: 10000 });
});

test("season change updates URL", async ({ page }) => {
  await page.goto("/?v=T2M&r=US-WI&from=1981&to=2024&s=ANN");
  await page.getByRole("radio", { name: "JJA", exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("s")).toBe("JJA");
});

test("inconsistent engine verdict stays provisional and does not trigger Explain", async ({ page }) => {
  let explains = 0;
  await page.route("**/api/py/analyze", (route) => route.fulfill({ json: {
    ...fixture, results: [{ ...fixture.results[0], stats: { ...fixture.results[0].stats, tests_agree: false, ols: { ...fixture.results[0].stats.ols, p: 0.42 } } }],
  } }));
  await page.route("**/api/partner", (route) => { explains++; return route.fulfill({ status: 503 }); });
  await page.goto("/?v=T2M&r=US-WI&from=2002&to=2025&s=JJA");
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wisconsin: Confirmed" })).toBeVisible();
  await expect(page.getByText(/Treat this result as provisional/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Explain this verdict" })).toHaveCount(0);
  expect(explains).toBe(0);
});
