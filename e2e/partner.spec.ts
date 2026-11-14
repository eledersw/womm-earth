import { expect, test, type Route } from "@playwright/test";
import variables from "../api/_fixtures/variables.json";
import regions from "../api/_fixtures/regions.json";
import fixture from "../api/_fixtures/analyze.json";
const sse = (text: string) => `data: ${JSON.stringify({ type: "text", text })}\n\ndata: {"type":"done"}\n\n`;
test.beforeEach(async ({ page }) => {
  // These tests exercise the panel. Globe geometry is covered by its owner.
  await page.route("**/geo/*.geojson", (route) => route.fulfill({ json: { type: "FeatureCollection", features: [] } }));
  await page.route("**/api/py/mirror", (route) => route.fulfill({ json: { base: { region: route.request().postDataJSON().regions[0], slope_per_decade: 0.8, p: 0.01, z: 2.5, tier: "confirmed" }, mirrors: [], none_found: true } }));
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
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wisconsin: Confirmed" })).toBeVisible();
  const box = page.getByRole("region", { name: "Explanation" });
  await expect(box.getByRole("alert")).toBeVisible();
  await box.getByRole("button", { name: "Retry explanation" }).click();
  await expect(box.getByText("Mann-Kendall detects a trend, p = 0.01.", { exact: true })).toBeVisible();
  await expect(box.getByText("Draft explanation · being checked")).toHaveCount(0);
});
test("a scientist link explains at that level and shows the methods table", async ({ page }) => {
  // The reading-level switch is gone from the UI (H7); shared links still carry lvl.
  await page.route("**/api/partner", (route) => {
    const level = route.request().postDataJSON().level;
    return route.fulfill({ contentType: "text/event-stream", body: sse(level === "scientist" ? "Scientist explanation." : "Student explanation.") });
  });
  await page.goto("/?r=US-WI&from=2002&to=2025&lvl=scientist");
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await expect(page.getByText("Scientist explanation.", { exact: true })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
});
test("too-short verdicts do not request explanations", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/py/analyze", (route) => route.fulfill({ json: { ...fixture, results: [{ ...fixture.results[0], stats: null, verdict: { tier: "too_short", years_needed: null, reason: null } }] } }));
  await page.route("**/api/partner", (route) => { requests++; return route.fulfill({ contentType: "text/event-stream", body: sse("Unexpected") }); });
  await page.goto("/?r=US-WI");
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wisconsin: Too short to judge" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Explanation" })).toHaveCount(0);
  expect(requests).toBe(0);
});
test("Stop cancels an in-flight explanation and permits retry", async ({ page }) => {
  const held: Route[] = [];
  await page.route("**/api/partner", (route) => { held.push(route); });
  await page.goto("/?r=US-WI");
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await expect.poll(() => held.length).toBe(1);
  const box = page.getByRole("region", { name: "Explanation" });
  await box.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(box.getByText("Explanation stopped.", { exact: true })).toBeVisible();
  await held[0].fulfill({ contentType: "text/event-stream", body: sse("Stale explanation") }).catch(() => {});
  await box.getByRole("button", { name: "Retry explanation" }).click();
  await expect.poll(() => held.length).toBe(2);
  await held[1].fulfill({ contentType: "text/event-stream", body: sse("Retried explanation.") });
  await expect(box.getByText("Retried explanation.", { exact: true })).toBeVisible();
  await expect(box.getByText("Stale explanation", { exact: true })).toHaveCount(0);
});

test("Partner proposes a Case without changing the URL until Open this case", async ({ page }) => {
  const query = "v=PRECTOTCORR&r=ESP&from=2002&to=2025&s=JJA&lvl=student";
  let calls = 0;
  await page.route("**/api/partner", (route) => {
    const input = route.request().postDataJSON();
    if (input.mode !== "chat") return route.fulfill({ contentType: "text/event-stream", body: sse("An explanation.") });
    calls++;
    expect(input.messages.at(-1).content).toBe("Is Wisconsin getting smokier in summer?");
    const events = [
      { type: "tool_call", name: "analyze_case" },
      { type: "tool_result", name: "analyze_case", data: { p: 0.01 } },
      { type: "propose_case", title: "Explore rainfall in Spain", query },
      { type: "text", text: "You can open the proposed Case." }, { type: "done" },
    ];
    return route.fulfill({ contentType: "text/event-stream", body: events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("") });
  });
  await page.goto("/?r=US-WI");
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await page.getByRole("textbox", { name: "Your question" }).fill("Is Wisconsin getting smokier in summer?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open this case", exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("r")).toBe("US-WI");
  await expect(page.getByText("You can open the proposed Case.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open this case", exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("r")).toBe("ESP");
  expect(calls).toBe(1);
  await page.screenshot({ path: test.info().outputPath("partner-chat.png"), fullPage: true });
});
test("Partner cancellation discards late text and allows a fresh question", async ({ page }) => {
  const held: Route[] = [];
  await page.route("**/api/partner", (route) => { if (route.request().postDataJSON().mode === "chat") held.push(route); else return route.fulfill({ contentType: "text/event-stream", body: sse("Template explanation.") }); });
  await page.goto("/?r=US-WI");
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await page.getByRole("textbox", { name: "Your question" }).fill("Check this Case");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect.poll(() => held.length).toBe(1);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await held[0].fulfill({ contentType: "text/event-stream", body: sse("Stale chat response") }).catch(() => {});
  await expect(page.getByText("Stale chat response", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Your question" })).toHaveValue("Check this Case");
  await expect(page.getByRole("button", { name: "Send", exact: true })).toBeEnabled();
});

// Explicit opt-in: real backend and Claude, with no fixture or SSE routes.
// BASE_URL points at the deployment with its server-side API key configured.
test("live partner proposes a case", async ({ page }) => {
  test.skip(process.env.E2E_PARTNER !== "1", "Requires E2E_PARTNER=1 and a deployment with Anthropic configured.");
  test.setTimeout(120000);
  await page.unrouteAll();
  await page.goto("/?v=T2M&r=US-CO&from=1981&to=2025&s=ANN&lvl=student");
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  await page.getByRole("textbox", { name: "Ask the Partner" }).fill("Analyze annual T2M in US-CO from 1981 to 2025 with analyze_case. Explain the returned verdict, then use propose_case to offer this Case for me to open.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open this case", exact: true })).toBeVisible({ timeout: 65000 });
});
