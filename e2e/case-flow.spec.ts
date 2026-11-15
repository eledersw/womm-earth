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
  // Panel/partner checks must not start the globe's full live map calculation.
  await page.route("**/api/py/trendmap**", (route) => {
    const query = new URL(route.request().url()).searchParams;
    return route.fulfill({ json: { variable: query.get("variable"), start: Number(query.get("start")), end: Number(query.get("end")), season: query.get("season"), entries: {} } });
  });
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

test("Investigate opens the results pane; the explain-and-ask pane stays open", async ({ page }) => {
  await page.route("**/api/py/analyze", (route) => route.fulfill({ json: fixture }));
  await page.goto("/?r=US-WI");
  await expect(page.getByRole("heading", { name: "Evidence", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  const results = page.getByRole("region", { name: "Results", exact: true });
  await expect(results.getByRole("heading", { name: "Evidence", exact: true })).toBeVisible();
  await expect(results.getByText("Wisconsin: Confirmed", { exact: true })).toBeVisible();
  const explain = page.getByRole("region", { name: "Gaia · explain & ask", exact: true });
  await expect(explain.getByRole("textbox", { name: "Your question" })).toBeVisible();
  await results.getByRole("button", { name: "Hide results" }).click();
  await expect(results).toHaveCount(0);
  await expect(explain).toBeVisible();
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

test("unavailable correlation makes no request; multivariable comparison needs two regions and three variables", async ({ page }) => {
  let correlations = 0;
  await page.route("**/api/py/correlate", (route) => { correlations++; return route.fulfill({ status: 503 }); });
  await page.route("**/api/partner", (route) => route.fulfill({ contentType: "text/event-stream", body: `data: {"type":"error","message":"Unavailable"}\n\ndata: {"type":"done"}\n\n` }));
  // Each variable and region gets its own trend so the radar shapes differ.
  const trend: Record<string, number> = { T2M: 0.8, PRECTOTCORR: -0.3, GWETROOT: -0.12, MODIS_AQUA_AOD: 0.05 };
  const analyzed: string[] = [];
  await page.route("**/api/py/analyze", (route) => {
    const body = route.request().postDataJSON();
    analyzed.push(body.variable);
    return route.fulfill({ json: { ...fixture, case: body, results: body.regions.map((id: string, i: number) => {
      const change = (trend[body.variable] ?? 0.2) * (i ? -0.6 : 1);
      return { ...fixture.results[0], region: regions.find((region) => region.id === id), stats: { ...fixture.results[0].stats, change_per_decade: change },
        verdict: { ...fixture.results[0].verdict, tier: Math.abs(change) > 0.3 ? "confirmed" : "no_case" } };
    }) } });
  });
  await page.goto("/?r=US-WI&from=2002&to=2025&s=JJA");
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wisconsin: Confirmed" })).toBeVisible();
  await expect(page.getByText("Correlation is not available yet. You can still investigate trends for each variable separately.")).toBeVisible();
  expect(correlations).toBe(0);
  const comparison = page.getByRole("region", { name: "Multivariable comparison", exact: true });
  await expect(comparison.getByText("Select at least two regions to compare them across several variables.")).toBeVisible();

  await page.goto("/?r=US-WI,ESP&from=2002&to=2025&s=JJA");
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Spain: Confirmed" })).toBeVisible();
  const compare = comparison.getByRole("button", { name: "Compare", exact: true });
  await expect(compare).toBeDisabled();
  await expect(comparison.getByText("Pick at least three variables (up to six).")).toBeVisible();
  await comparison.getByRole("button", { name: "Rain and snow", exact: true }).click();
  await comparison.getByRole("button", { name: "Soil moisture at roots", exact: true }).click();
  await comparison.getByRole("button", { name: "Aerosol optical depth", exact: true }).click();
  analyzed.length = 0;
  await compare.click();
  const radar = comparison.getByRole("img", { name: /Radar chart/ });
  await expect(radar).toBeVisible();
  // The Case's own variable is reused, not fetched again.
  expect(analyzed.sort()).toEqual(["GWETROOT", "MODIS_AQUA_AOD", "PRECTOTCORR"]);
  await expect(radar.locator("polygon[stroke^='var(--series']")).toHaveCount(2);
  await comparison.getByText("Show as a table").click();
  await expect(comparison.getByRole("table")).toContainText("Rain and snow");
  await comparison.scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("multivariable.png") });
});

test("the panel has no predict or guide controls", async ({ page }) => {
  await page.route("**/api/py/analyze", (route) => route.fulfill({ json: fixture }));
  await page.goto("/?r=US-WI&from=2002&to=2025&s=JJA");
  await expect(page.getByRole("button", { name: "Investigate", exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Predict before reveal" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Guide me through this Case" })).toHaveCount(0);
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wisconsin: Confirmed" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guide me through this Case" })).toHaveCount(0);
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
  await page.getByRole("radio", { name: "Jun–Aug", exact: true }).click();
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
  const results = page.getByRole("region", { name: "Results", exact: true });
  await expect(results.getByText(/Treat this result as provisional/)).toBeVisible();
  const explanation = page.getByRole("region", { name: "Explanation", exact: true });
  await expect(explanation.getByRole("alert")).toContainText("provisional");
  expect(explains).toBe(0);
});
