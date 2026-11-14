import { expect, it, vi } from "vitest";
import fixture from "@/api/_fixtures/analyze.json";
import variables from "@/api/_fixtures/variables.json";
import { SYSTEM } from "./prompts";
import { summarizeAnalysis } from "./summarize";
import { checkNumbers } from "./number-check";
import { explainInputSchema } from "./input";
it("SYSTEM is deterministic", async () => {
  vi.resetModules();
  expect((await import("./prompts")).SYSTEM).toBe(SYSTEM);
  expect(SYSTEM).not.toMatch(/Date|2026/);
});
it("summarizeAnalysis drops arrays", () => {
  const input = explainInputSchema.parse({ mode: "explain", level: "student", analysis: fixture.results[0], variable: variables[0], regionName: "Wisconsin", period: "2002–2025", seasonLabel: "JJA" });
  const summary = summarizeAnalysis(input.analysis, input.variable, input.regionName, input.period, input.seasonLabel);
  expect(summary).not.toHaveProperty("monthly"); expect(summary).not.toHaveProperty("fit"); expect(summary).not.toHaveProperty("yearly");
  expect(summary.stats).toEqual(input.analysis.stats);
});
it("grounds the documented significance threshold in explanations", () => {
  const input = explainInputSchema.parse({ mode: "explain", level: "student", analysis: fixture.results[0], variable: variables[0], regionName: "Wisconsin", period: "2002–2025", seasonLabel: "JJA" });
  const analysis = {
    ...input.analysis,
    stats: { ...input.analysis.stats!, change_per_decade: -0.842 },
    verdict: { ...input.analysis.verdict, years_needed: 10 },
  };
  const summary = summarizeAnalysis(analysis, input.variable, input.regionName, input.period, input.seasonLabel);
  expect(checkNumbers(
    "Mann-Kendall p = 0.01; threshold 0.05; 95% interval; dipped by 0.84 per decade; a 50–50 chance in 10 years",
    [summary],
  ).ok).toBe(true);
});
