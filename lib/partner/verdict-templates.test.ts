import { describe, expect, it } from "vitest";
import fixture from "@/api/_fixtures/analyze.json";
import type { RegionAnalysis } from "@/lib/api/types";
import { renderVerdict } from "./verdict-templates";
import { fmtP, fmtSlope } from "./format";
const base = fixture.results[0] as unknown as RegionAnalysis;
const ctx = { variableName: "Air temperature", unit: "°C", regionName: "Wisconsin", period: "2002–2025", seasonLabel: "JJA" };
describe("verdict templates", () => {
  it("renderVerdict confirmed student", () => {
    const result = renderVerdict(base, ctx, "student");
    expect(result.badge).toBe("Confirmed");
    expect(result.body).toContain(fmtSlope(base.stats!.change_per_decade));
    expect(result.body).toContain("per decade");
    expect(result.body).toMatch(/Mann.Kendall/);
  });
  it("renderVerdict not_proven shows years", () => {
    const result = renderVerdict({ ...base, stats: { ...base.stats!, mk: { ...base.stats!.mk, p: 0.1 }, ols: { ...base.stats!.ols, p: 0.12 } }, verdict: { tier: "not_proven", years_needed: 12, reason: null } }, ctx, "student");
    expect(result.body).toContain("12");
    expect(result.body).toContain("assuming the slope and variability stay the same");
  });
  it("renderVerdict no_case never says no change", () => {
    expect(renderVerdict({ ...base, verdict: { tier: "no_case", years_needed: null, reason: null } }, ctx, "student").body).not.toMatch(/no change/i);
  });
  it("renderVerdict too_short", () => {
    const result = renderVerdict({ ...base, stats: null, verdict: { tier: "too_short", years_needed: null, reason: null } }, ctx, "scientist");
    expect(result.badge).toBe("Too short to judge");
    expect(result.body).not.toMatch(/NaN|null|undefined/);
  });
  it("tests_disagree warning surfaces", () => {
    const r = { ...base, stats: { ...base.stats!, tests_agree: false, ols: { ...base.stats!.ols, p: 0.1 } }, verdict: { ...base.verdict, tier: "not_proven" as const } };
    expect(renderVerdict(r, ctx, "student").body).toContain("tests give different answers");
  });
  it("does not invent a detection time or statistics", () => {
    const result = renderVerdict({ ...base, stats: null, verdict: { tier: "not_proven", years_needed: null, reason: null } }, ctx, "scientist");
    expect(result.body).not.toMatch(/NaN|null|undefined|≈/);
  });
  it("formats signed slopes and small p-values", () => {
    expect(fmtSlope(0.01234)).toBe("+0.012"); expect(fmtSlope(-1.234)).toBe("-1.2");
    expect(fmtSlope(0)).toBe("0.0"); expect(fmtP(0.0001)).toBe("< 0.001"); expect(fmtP(0.1234)).toBe("0.123");
    expect(fmtSlope(NaN)).toBe("—"); expect(fmtP(Infinity)).toBe("—");
  });
});

it("does not show a detection estimate when OLS uncertainty is unavailable", () => {
  const r = { ...base, stats: { ...base.stats!, ols: { ...base.stats!.ols, n_eff: 2 } }, verdict: { tier: "not_proven" as const, years_needed: 12, reason: null } };
  expect(renderVerdict(r, ctx, "student").body).not.toContain("≈12");
});

it("renders mismatch without endorsing a combined Confirmed or showing an estimate", () => {
  const r = { ...base, stats: { ...base.stats!, tests_agree: false, ols: { ...base.stats!.ols, p: 0.42 } } };
  const view = renderVerdict(r, ctx, "scientist");
  expect(view.badge).toBe("Confirmed");
  expect(view.body).toContain("provisional");
  expect(view.body).not.toContain("Confirmed under the nominal combined rule");
});
it("does not round across tier boundaries or render an invalid p operator", () => {
  for (const p of [0, 0.04999999, 0.05, 0.19999999, 0.2]) {
    const tier: RegionAnalysis["verdict"]["tier"] = p < 0.05 ? "confirmed" : p < 0.2 ? "not_proven" : "no_case";
    const r = { ...base, stats: { ...base.stats!, mk: { ...base.stats!.mk, p }, ols: { ...base.stats!.ols, p } }, verdict: { ...base.verdict, tier } };
    const view = renderVerdict(r, ctx, "scientist");
    expect(view.body).not.toMatch(/=\s*</);
    expect(view.body).not.toMatch(/\{\w+\}|NaN|undefined/);
  }
  expect(Number(fmtP(0.05 - Number.EPSILON))).toBeLessThan(0.05);
  expect(Number(fmtP(0.2 - Number.EPSILON))).toBeLessThan(0.2);
  expect(Number(fmtP(0.04999999))).toBeLessThan(0.05);
  expect(Number(fmtP(0.19999999))).toBeLessThan(0.2);
});
it("maps eligibility reasons and suppresses all inferential claims for failed coverage", () => {
  const r = { ...base, yearly: base.yearly.slice(0, 2), verdict: { tier: "too_short" as const, years_needed: null, reason: "<script>untrusted reason</script>" } };
  const view = renderVerdict(r, ctx, "student");
  expect(view.body).not.toMatch(/<script>|p =|CI|per decade/);
  expect(view.body).toContain("data requirements");
});
it("labels MK fallback and preserves an eligible zero estimate", () => {
  const fallback = { ...base, stats: { ...base.stats!, ols: { ...base.stats!.ols, n_eff: 2 } } };
  expect(renderVerdict(fallback, ctx, "student").body).toContain("Mann–Kendall alone");
  const r = { ...base, stats: { ...base.stats!, mk: { ...base.stats!.mk, p: 0.1 }, ols: { ...base.stats!.ols, p: 0.1 } }, verdict: { tier: "not_proven" as const, years_needed: 0, reason: null } };
  expect(renderVerdict(r, ctx, "student").body).toContain("0 additional years");
  expect(renderVerdict(r, ctx, "student").body).toContain("already meet its threshold");
});
