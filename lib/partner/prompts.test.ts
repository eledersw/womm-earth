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
    stats: { ...input.analysis.stats!, change_per_decade: -0.842, mk: { ...input.analysis.stats!.mk, p: 0.1 }, ols: { ...input.analysis.stats!.ols, p: 0.1 } },
    verdict: { ...input.analysis.verdict, tier: "not_proven" as const, years_needed: 10 },
  };
  const summary = summarizeAnalysis(analysis, input.variable, input.regionName, input.period, input.seasonLabel);
  expect(checkNumbers(
    "Mann-Kendall p = 0.1; threshold 0.05; 95% interval; dipped by 0.84 per decade; approximate estimate of 10 additional years",
    [summary],
  ).ok).toBe(true);
  expect(summary.detection_probability_percent).toBeNull();
  expect(summary.magnitude_per_decade).toBe(0.842);
});

it("uses Sergio's exact common and mode-specific rules with separate tool availability", async () => {
  const { readFileSync } = await import("node:fs");
  const { COMMON_RULES, EXPLAIN_SYSTEM, CHAT_SYSTEM } = await import("./prompts");
  const source = readFileSync("docs/science/VERDICT_TEMPLATES.md", "utf8").split("## 5. Partner grounding rules: prompt text")[1];
  const blocks = source.split("~~~text\n").slice(1).map((s) => s.split("~~~")[0].trim());
  expect(COMMON_RULES).toBe(blocks[0]);
  expect(SYSTEM.startsWith(COMMON_RULES)).toBe(true);
  expect(EXPLAIN_SYSTEM).toBe(`${SYSTEM}\n\n${blocks[1]}`);
  expect(CHAT_SYSTEM).toBe(`${SYSTEM}\n\n${blocks[2]}`);
  expect(EXPLAIN_SYSTEM).toContain("No tools are available in this mode");
  expect(CHAT_SYSTEM).not.toContain("No tools are available in this mode");
  expect(CHAT_SYSTEM).toContain("Labelling an invented mechanism as general knowledge does not make it permitted");
});
it("grounds IDs, custom months, converted intervals and only applicable process cards", () => {
  const input = explainInputSchema.parse({ mode: "explain", level: "student", analysis: fixture.results[0], variable: variables[0], regionName: "Wisconsin", period: "2002–2025", seasonLabel: "CUSTOM (6,7,8)" });
  const summary = summarizeAnalysis(input.analysis, input.variable, input.regionName, input.period, input.seasonLabel);
  expect(summary).toMatchObject({ region_id: "US-WI", variable_id: "T2M", months: [6,7,8], display_evidence: { status: "combined" }, sen_ci_per_decade: { low: 0.3, high: 1.3, unit: "°C/decade" } });
  expect(summary.process_cards.length).toBeGreaterThan(0);
  expect(summary.process_cards.every((card) => card.applies_to.variables.includes("T2M") && card.applies_to.regions.includes("US-WI"))).toBe(true);
});
it("withholds failed-coverage inference, Celsius percentages and unsafe estimates", () => {
  const input = explainInputSchema.parse({ mode: "explain", level: "student", analysis: fixture.results[0], variable: variables[0], regionName: "Wisconsin", period: "1981–2025", seasonLabel: "ANN" });
  const summary = summarizeAnalysis(input.analysis, input.variable, input.regionName, input.period, input.seasonLabel);
  expect(summary).toMatchObject({ stats: null, sen_ci_per_decade: null, verdict: { tier: "confirmed", years_needed: null }, display_evidence: { status: "mismatch", p_mk: null, p_ols: null, p_used: null } });
  const changed = { ...input.analysis, stats: { ...input.analysis.stats!, pct_of_mean_per_decade: 2 } };
  expect(summarizeAnalysis(changed, { ...input.variable, ratio_scale: true }, "Wisconsin", "2002–2025", "JJA").stats?.pct_of_mean_per_decade).toBeNull();
});
