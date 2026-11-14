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
    expect(result.body).toContain("Mann-Kendall");
  });
  it("renderVerdict not_proven shows years", () => {
    const result = renderVerdict({ ...base, verdict: { tier: "not_proven", years_needed: 12, reason: null } }, ctx, "student");
    expect(result.body).toContain("12");
    expect(result.body).toContain("assuming slope and noise stay the same");
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
    expect(renderVerdict({ ...base, warnings: ["tests_disagree"] }, ctx, "student").body).toContain("treat this with caution");
  });
  it("does not invent a detection time or statistics", () => {
    const result = renderVerdict({ ...base, stats: null, verdict: { tier: "not_proven", years_needed: null, reason: null } }, ctx, "scientist");
    expect(result.body).not.toMatch(/NaN|null|undefined|≈/);
  });
  it("formats signed slopes and small p-values", () => {
    expect(fmtSlope(0.01234)).toBe("+0.012"); expect(fmtSlope(-1.234)).toBe("-1.2");
    expect(fmtSlope(0)).toBe("0.0"); expect(fmtP(0.0001)).toBe("< 0.001"); expect(fmtP(0.1234)).toBe("0.12");
    expect(fmtSlope(NaN)).toBe("—"); expect(fmtP(Infinity)).toBe("—");
  });
});
