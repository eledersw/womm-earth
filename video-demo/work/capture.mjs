// Captures the real WOMM Earth app (production build) for the brag video.
// Analyses and the Gaia chat answer are replayed from real responses saved in
// video-demo/work/data, so every screen is deterministic.
import { chromium } from "@playwright/test";
import fs from "node:fs";
const DATA = "video-demo/work/data";
const OUT = "video-demo/work/shots";
fs.mkdirSync(OUT, { recursive: true });
const read = (f) => fs.readFileSync(`${DATA}/${f}`, "utf8");
const boxes = {};

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--use-gl=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await page.route("**/api/py/analyze", (route) => {
  const v = route.request().postDataJSON().variable;
  return route.fulfill({ contentType: "application/json", body: read(`analyze-${v}.json`) });
});
await page.route("**/api/py/correlate", (route) => route.fulfill({ contentType: "application/json", body: read("correlate.json") }));
await page.route("**/api/py/variables", (route) => route.fulfill({ contentType: "application/json", body: read("vars.json") }));
await page.route("**/api/py/regions", (route) => route.fulfill({ contentType: "application/json", body: read("regions.json") }));
let explains = 0;
await page.route("**/api/partner", async (route) => {
  const body = route.request().postDataJSON();
  if (body.mode === "chat") return route.fulfill({ contentType: "text/event-stream", body: read("gaia.sse") });
  explains++;
  return route.continue(); // real Gaia explanation from production
});
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log("shot", name); };
const box = async (name, locator) => { const b = await locator.boundingBox(); boxes[name] = b; return b; };
const hideDev = () => page.addStyleTag({ content: "nextjs-portal{display:none!important}" });

// 1. Hook: the case loaded, globe showing Belgium and the Netherlands.
await page.goto("https://womm-earth.vercel.app/?v=T2M&r=BEL,NLD&from=2000&to=2020&s=ANN");
await hideDev();
const investigate = page.getByRole("button", { name: "Investigate", exact: true });
await investigate.waitFor();
await page.waitForFunction(() => [...document.querySelectorAll("select")].some((s) => s.options.length > 3), null, { timeout: 60000 });
await page.waitForTimeout(12000); // let the globe load
// Turn the globe to Europe: picking an already-selected place in search flies there.
await page.getByRole("button", { name: "Find a place", exact: true }).click();
await page.getByPlaceholder(/Country, state/).fill("Belgium");
await page.keyboard.press("Enter");
await page.keyboard.press("Escape");
await page.mouse.move(1890, 1060);
await page.waitForTimeout(5000);
await shot("01-case");
await box("investigate", investigate);
await box("panel", page.locator("#case-panel"));
await box("globe", page.locator("canvas").first());

// 2. Investigate: verdicts, chart, Gaia explanations.
await investigate.click();
const results = page.getByRole("region", { name: "Results", exact: true });
await results.getByRole("article").first().waitFor({ timeout: 60000 });
await page.waitForFunction(() => { const t = document.querySelector('section[aria-label="Gaia · explain & ask"]')?.innerText ?? ""; return /BELGIUM/.test(t) && /NETHERLANDS/.test(t) && !/preparing/i.test(t); }, null, { timeout: 90000 });
await page.waitForTimeout(1500);
await shot("02-results");
const evidence = page.locator('[data-case-step="evidence"]');
await evidence.evaluate((el) => el.scrollIntoView({ block: "start" }));
await page.waitForTimeout(1200);
await shot("02b-evidence");
await box("evidence", evidence);
await box("results", results);
await box("explain", page.getByRole("region", { name: "Gaia · explain & ask", exact: true }));

// 3. Correlation with sunlight.
const corr = page.getByRole("region", { name: "Correlation", exact: true });
await corr.scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await box("corrSelect", corr.locator("select"));
await shot("03a-corr-before");
await corr.locator("select").selectOption("ALLSKY_SFC_SW_DWN");
await corr.getByText("Raw Pearson r").waitFor({ timeout: 30000 });
await page.waitForTimeout(2500);
await corr.evaluate((el) => el.scrollIntoView({ block: "start" }));
await page.waitForTimeout(800);
await shot("03b-corr");
await box("corr", corr);

// 4. Multivariable comparison: three variables, Compare, radar.
const mv = page.getByRole("region", { name: "Multivariable comparison", exact: true });
await mv.evaluate((el) => el.scrollIntoView({ block: "start" }));
await page.waitForTimeout(800);
await shot("04a-mv-pick");
await box("mvRain", mv.getByRole("button", { name: "Rain and snow", exact: true }));
await box("mvSun", mv.getByRole("button", { name: "Sunlight at ground", exact: true }));
await mv.getByRole("button", { name: "Rain and snow", exact: true }).click();
await mv.getByRole("button", { name: "Sunlight at ground", exact: true }).click();
await page.waitForTimeout(500);
await box("mvCompare", mv.getByRole("button", { name: "Compare", exact: true }));
await shot("04b-mv-picked");
await mv.getByRole("button", { name: "Compare", exact: true }).click();
await mv.getByRole("img", { name: /Radar chart/ }).waitFor({ timeout: 30000 });
await page.waitForTimeout(1500);
await mv.getByRole("img", { name: /Radar chart/ }).evaluate((el) => el.scrollIntoView({ block: "center" }));
await page.waitForTimeout(800);
await shot("04c-radar");
await box("radar", mv.getByRole("img", { name: /Radar chart/ }));

// 5. Ask Gaia.
const chat = page.getByRole("region", { name: "Ask Gaia", exact: true });
const input = chat.getByRole("textbox", { name: "Your question" });
await input.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await box("gaiaInput", input);
await input.fill("What does \"Not proven yet\" mean here?");
await page.waitForTimeout(400);
await shot("05a-gaia-typed");
await box("gaiaSend", chat.getByRole("button", { name: "Send", exact: true }));
await chat.getByRole("button", { name: "Send", exact: true }).click();
await chat.locator("strong").first().waitFor({ timeout: 30000 });
await page.waitForTimeout(1500);
const answer = chat.locator('ul[aria-label="Conversation"] > li').last();
await answer.evaluate((el) => el.scrollIntoView({ block: "start" }));
await page.waitForTimeout(800);
await shot("05b-gaia-answer");
await box("gaiaPane", page.getByRole("region", { name: "Gaia · explain & ask", exact: true }));
await box("mascot", page.locator("svg.gaia-mascot"));

fs.writeFileSync(`${OUT}/boxes.json`, JSON.stringify(boxes, null, 2));
console.log("real explain calls:", explains);
await browser.close();
