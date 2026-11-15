import { expect, it, vi } from "vitest";
import type { serverApi } from "@/lib/api/client";
import fixture from "@/api/_fixtures/analyze.json";
import variables from "@/api/_fixtures/variables.json";
import regions from "@/api/_fixtures/regions.json";
import { makeTools } from "./tools";
import type { PartnerEvent } from "./events";
import { caseFromQuery } from "@/lib/state/case-codec";
function setup() {
  const extra = [...regions, { ...regions[0], id: "R5" }, { ...regions[0], id: "R6" }];
  const py = { GET: vi.fn(async (path: string) => ({ data: path.endsWith("regions") ? extra : variables })), POST: vi.fn(async (path: string) => { void path; return { data: fixture }; }) };
  const events: PartnerEvent[] = [];
  const tools = makeTools(py as unknown as ReturnType<typeof serverApi>, (e) => events.push(e));
  const run = async (name: string, value: unknown) => { const tool = tools.find((t) => t.name === name)!; return JSON.parse(await tool.run(tool.parse(value)) as string); };
  return { events, py, run };
}
it("propose_case clamps and validates", async () => {
  const { run, events } = setup();
  const input = { variable: "T2M", regions: ["USA", "US-WI", "ESP", "NR-SAHEL", "R5", "R6"], from: 2002, to: 2025, season: "JJA", title: "A Case" };
  expect(await run("propose_case", input)).toBe("proposed");
  const proposal = events.find((e) => e.type === "propose_case");
  expect(proposal?.type === "propose_case" && caseFromQuery(proposal.query).regions).toEqual(input.regions.slice(0, 4));
  events.length = 0;
  expect(JSON.stringify(await run("propose_case", { ...input, regions: ["unknown"] }))).toContain("unknown");
  expect(events.some((e) => e.type === "propose_case")).toBe(false);
});
it("analyze_case result has no arrays of observations or fits", async () => {
  const { run } = setup();
  const result = await run("analyze_case", { variable: "T2M", regions: ["US-WI"], from: 2002, to: 2025, season: "JJA" });
  expect(result.results[0]).not.toHaveProperty("monthly"); expect(result.results[0]).not.toHaveProperty("yearly"); expect(result.results[0]).not.toHaveProperty("fit");
  expect(result.results[0].stats).toEqual(fixture.results[0].stats);
});
it("tools emit call and result events", async () => {
  const { run, events } = setup(); await run("list_variables", {});
  expect(events.map((e) => e.type)).toEqual(["tool_call", "tool_result"]);
});
it("validates ids before scientific requests and rejects invalid custom months", async () => {
  const { run, py } = setup();
  await run("analyze_case", { variable: "T2M", regions: ["unknown"], from: 2002, to: 2025, season: "JJA" });
  await run("analyze_case", { variable: "T2M", regions: ["US-WI"], from: 2002, to: 2025, season: "CUSTOM", months: [1, 4] });
  expect(py.POST).not.toHaveBeenCalled();
});
it("returns available process-card ids without inventing content", async () => {
  const { run } = setup(); expect(await run("get_process_card", { id: "missing" })).toEqual({ available_ids: expect.arrayContaining(["regional-warming", "smoke-aod", "snow-depth-and-season"]) });
});
it("rejects URL-like unexpected tool inputs at the schema boundary", () => {
  const tools = makeTools({} as ReturnType<typeof serverApi>, () => {});
  const tool = tools.find((t) => t.name === "list_variables")!;
  expect(() => tool.parse({ url: "http://localhost/private" })).toThrow();
});
it("correlate discloses unavailability without fetching or exposing fixture statistics", async () => {
  const { run, py, events } = setup();
  const result = await run("correlate", { var_x: "T2M", var_y: "PRECTOTCORR", region: "US-WI", from: 2002, to: 2025 });
  expect(result).toMatchObject({ available: false, reason: expect.stringContaining("No correlation was calculated") });
  expect(result).not.toHaveProperty("pearson_raw");
  expect(py.POST).not.toHaveBeenCalled();
  expect(py.GET).not.toHaveBeenCalled();
  expect(events.map((e) => e.type)).toEqual(["tool_call", "tool_result"]);
});

it("mirror and scan call only the fixed backend paths", async () => {
  const { run, py } = setup();
  await run("find_mirror", { variable: "T2M", region: "US-WI", from: 2002, to: 2025, season: "JJA" });
  await run("scan_region", { region: "US-WI", from: 2002, to: 2025 });
  expect(py.POST.mock.calls.map(([path]) => path)).toEqual(["/api/py/mirror", "/api/py/scan"]);
});
it("sanitizes backend failures and still emits the matching result event", async () => {
  const { run, py, events } = setup(); py.POST.mockRejectedValue(new Error("private backend detail"));
  const result = await run("analyze_case", { variable: "T2M", regions: ["US-WI"], from: 2002, to: 2025, season: "ANN" });
  expect(JSON.stringify(result)).not.toContain("private");
  expect(events.map((e) => e.type)).toEqual(["tool_call", "tool_result"]);
});
