import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { RegionAnalysis, Variable } from "@/lib/api/types";
import variables from "@/api/_fixtures/variables.json";
import { evidencePeriod, inspectEvidence } from "./evidence";
import { renderVerdict } from "./verdict-templates";
import { summarizeAnalysis } from "./summarize";

// Archived observations from Sergio's review, not a fresh production check.
const archive = JSON.parse(readFileSync("docs/science/review/production_review.json", "utf8")) as {
  cases: Record<string, { request: { variable: string; start: number; end: number; season: string }; response: { results: RegionAnalysis[] } }>;
};
function reviewed(id: string) {
  const item = archive.cases[id];
  const result = { ...item.response.results[0], monthly: [], fit: [] };
  const variable = variables.find((v) => v.id === item.request.variable)! as Variable;
  const context = { variableName: variable.name, unit: variable.unit, regionName: result.region.name, period: `${item.request.start}–${item.request.end}`, seasonLabel: item.request.season };
  return { result, variable, context };
}
it("B2: keeps archived Aral Confirmed provisional when adjusted OLS blocks confirmation", () => {
  const { result, variable, context } = reviewed("diagnostic-aral-wetness");
  const before = structuredClone(result);
  expect(result.verdict.tier).toBe("confirmed");
  expect(inspectEvidence(result, evidencePeriod(context.period, context.seasonLabel)).status).toBe("mismatch");
  expect(renderVerdict(result, context, "student")).toMatchObject({ badge: "Confirmed", body: expect.stringContaining("provisional") });
  const summary = summarizeAnalysis(result, variable, context.regionName, context.period, context.seasonLabel);
  expect(summary.display_evidence.years_eligible).toBe(false);
  expect(result).toEqual(before);
});
it("B3: suppresses the archived 27-year estimate for Wisconsin precipitation No case", () => {
  const { result, variable, context } = reviewed("backup-wi-precipitation");
  expect(result.verdict).toMatchObject({ tier: "no_case", years_needed: 27 });
  expect(renderVerdict(result, context, "student").body).not.toContain("27");
  const summary = summarizeAnalysis(result, variable, context.regionName, context.period, context.seasonLabel);
  expect(summary.verdict).toMatchObject({ tier: "no_case", years_needed: null });
  expect(summary.display_evidence.years_eligible).toBe(false);
});
