import { expect, it, vi } from "vitest";
import fixture from "@/api/_fixtures/analyze.json";
import variables from "@/api/_fixtures/variables.json";
import { SYSTEM } from "./prompts";
import { summarizeAnalysis } from "./summarize";
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
