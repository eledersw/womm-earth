import { expect, it, vi } from "vitest";
import rawFixture from "@/api/_fixtures/analyze.json";
import { explainInputSchema } from "./input";
import catalogue from "@/api/_fixtures/variables.json";
import type { AnalyzeResponse, Variable } from "@/lib/api/types";
import { caseFromQuery, caseKey } from "@/lib/state/case-codec";
import type { Tour } from "@/lib/tour/types";
import { generateDemoExplanations } from "./demo-generator";
import { approvedDemo, demoCacheSchema } from "./demo-cache";
const analysis = explainInputSchema.parse({ mode: "explain", level: "student", analysis: rawFixture.results[0], variable: catalogue[0], regionName: "Wisconsin", period: "2002–2025", seasonLabel: "JJA" }).analysis;
const fixture: AnalyzeResponse = { case: { ...rawFixture.case, season: "JJA" }, results: [analysis] };
const query = "v=T2M&r=US-WI&from=2002&to=2025&s=JJA&lvl=student";
const state = caseFromQuery(query);
const tour: Tour = { id: "test-only", title: "Test", steps: [{ query, caption: "Test fixture" }] };
function dependencies() {
  return {
    variables: vi.fn(async () => catalogue as Variable[]),
    analyze: vi.fn<Parameters<typeof generateDemoExplanations>[1]["analyze"]>(async () => structuredClone(fixture)),
    explain: vi.fn<Parameters<typeof generateDemoExplanations>[1]["explain"]>(async (input, emit) => { emit({ type: "text", text: `${input.level}: p = 0.01.` }); }),
    now: () => new Date("2026-11-14T18:00:00Z"),
  };
}
it("generates both levels, deduplicates final Cases, and requires separate scientific approval", async () => {
  const deps = dependencies();
  const cache = await generateDemoExplanations([tour, tour], deps);
  expect(deps.analyze).toHaveBeenCalledTimes(1);
  expect(deps.explain.mock.calls.map(([input]) => input.level)).toEqual(["student", "scientist"]);
  expect(demoCacheSchema.safeParse(cache).success).toBe(true);
  expect(cache[caseKey(state)].generated_at).toBe("2026-11-14T18:00:00.000Z");
  expect(approvedDemo(cache, state, "US-WI", "student")).toBeUndefined();
  cache[caseKey(state)].approved_by = "methods-lead";
  expect(approvedDemo(cache, state, "US-WI", "scientist")).toBe("scientist: p = 0.01.");
  expect(approvedDemo(cache, state, "ESP", "student")).toBeUndefined();
  expect(approvedDemo(cache, { ...state, season: "ANN" }, "US-WI", "student")).toBeUndefined();
});
it("uses only the final step, returns sorted keys, and isolates each region's text", async () => {
  const deps = dependencies();
  deps.analyze.mockImplementation(async (s) => ({ ...fixture, case: { ...fixture.case, regions: s.regions }, results: s.regions.map((id) => ({ ...fixture.results[0], region: { ...fixture.results[0].region, id, name: id } })) } as AnalyzeResponse));
  deps.explain.mockImplementation(async (input, emit) => { emit({ type: "text", text: `${input.regionName} ${input.level} explanation.` }); });
  const multi = { ...tour, steps: [...tour.steps, { query: query.replace("US-WI", "US-WI,ESP"), caption: "Final" }] };
  const cache = await generateDemoExplanations([multi, tour], deps);
  expect(Object.keys(cache)).toEqual(Object.keys(cache).sort((a, b) => a.localeCompare(b)));
  const multiState = caseFromQuery(multi.steps[1].query);
  cache[caseKey(multiState)].approved_by = "methods-lead";
  expect(approvedDemo(cache, multiState, "ESP", "student")).toBe("ESP student explanation.");
  const legacy = { ...cache[caseKey(multiState)], regions: undefined };
  expect(approvedDemo({ [caseKey(multiState)]: legacy }, multiState, "ESP", "student")).toBeUndefined();
});
it("blocks absent tours and mismatched analyses before asking Claude", async () => {
  const deps = dependencies();
  await expect(generateDemoExplanations([], deps)).rejects.toThrow("No approved demo tours");
  expect(deps.variables).not.toHaveBeenCalled();
  deps.analyze.mockResolvedValue({ ...fixture, case: { ...fixture.case, start: 1981 } } as AnalyzeResponse);
  await expect(generateDemoExplanations([tour], deps)).rejects.toThrow("does not match");
  expect(deps.explain).not.toHaveBeenCalled();
});
it.each(["unsupported", "empty", "error"])("rejects %s explanations without returning a publishable cache", async (failure) => {
  const deps = dependencies();
  deps.explain.mockImplementation(async (_input, emit) => {
    emit({ type: "text", text: failure === "empty" ? "" : failure === "unsupported" ? "A slope of 98765.4321." : "Partial text." });
    if (failure === "error") emit({ type: "error", message: "Unavailable" });
  });
  await expect(generateDemoExplanations([tour], deps)).rejects.toThrow("verification failed");
});
it("rejects too-short series and malformed cache metadata", async () => {
  const deps = dependencies();
  deps.analyze.mockResolvedValue({ ...fixture, results: [{ ...fixture.results[0], stats: null }] } as AnalyzeResponse);
  await expect(generateDemoExplanations([tour], deps)).rejects.toThrow("cannot support");
  expect(approvedDemo({ [caseKey(state)]: { student: "Test", scientist: "Test", generated_at: "invalid", approved_by: "methods-lead" } }, state, "US-WI", "student")).toBeUndefined();
});
it("blocks demo generation before Claude when engine statistics conflict with its tier", async () => {
  const deps = dependencies();
  deps.analyze.mockResolvedValue({ ...fixture, results: [{ ...analysis, stats: { ...analysis.stats!, tests_agree: false, ols: { ...analysis.stats!.ols, p: 0.42 } } }] });
  await expect(generateDemoExplanations([tour], deps)).rejects.toThrow("alignment/review");
  expect(deps.explain).not.toHaveBeenCalled();
});
