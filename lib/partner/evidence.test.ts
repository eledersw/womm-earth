import { expect, it } from "vitest";
import fixture from "@/api/_fixtures/analyze.json";
import type { RegionAnalysis } from "@/lib/api/types";
import { evidencePeriod, inspectEvidence } from "./evidence";
const base = fixture.results[0] as unknown as RegionAnalysis;
const period = evidencePeriod("2002–2025", "JJA")!;
const result = (mk: number, ols: number, tier: RegionAnalysis["verdict"]["tier"]) => ({ ...base, stats: { ...base.stats!, tests_agree: (mk < 0.05) === (ols < 0.05), mk: { ...base.stats!.mk, p: mk }, ols: { ...base.stats!.ols, p: ols } }, verdict: { ...base.verdict, tier } });
it.each([[0.04999999,"confirmed"], [0.05,"not_proven"], [0.1999999,"not_proven"], [0.2,"no_case"]] as const)("uses full precision at %s without changing the returned verdict", (p, tier) => {
  const r = result(0.01, p, tier); const before = structuredClone(r);
  expect(inspectEvidence(r, period)).toMatchObject({ status: "combined", p_used: p, years_eligible: false });
  expect(r).toEqual(before);
});
it("flags a reported MK-only Confirmed when OLS blocks the combined rule", () => {
  expect(inspectEvidence(result(0.01, 0.42, "confirmed"), period)).toMatchObject({ status: "mismatch", tests_disagree: true, p_used: 0.42 });
});
it("checks actual coverage, duplicated years, zero slots and DJF/custom boundaries", () => {
  const r = { ...base, yearly: base.yearly.slice(0, 19), stats: { ...base.stats!, n_years: 19 } };
  expect(inspectEvidence(r, period)).toMatchObject({ eligible: false, status: "mismatch" });
  expect(inspectEvidence({ ...r, verdict: { ...r.verdict, tier: "too_short" } }, period).status).toBe("ineligible");
  expect(inspectEvidence({ ...base, yearly: [...base.yearly, base.yearly[0]] }, period).eligible).toBe(false);
  expect(inspectEvidence(base, evidencePeriod("2002–2002", "DJF")).eligible_slots).toBe(0);
  for (const season of ["DJF", "CUSTOM (11,12,1)"]) expect(inspectEvidence(base, evidencePeriod("2002–2025", season)).eligible_slots).toBe(23);
});
it("never invents inference or agreement from malformed components; labels disclosed fallback", () => {
  expect(inspectEvidence({ ...base, stats: null }, period).status).toBe("unavailable");
  const unavailable = { ...base, stats: { ...base.stats!, ols: { ...base.stats!.ols, p: NaN } } };
  expect(inspectEvidence(unavailable, period)).toMatchObject({ status: "unavailable", tests_disagree: false });
  expect(inspectEvidence({ ...unavailable, stats: { ...unavailable.stats, ols: { ...unavailable.stats.ols, n_eff: 2 } } }, period)).toMatchObject({ status: "mk_only", tests_disagree: false, years_eligible: false });
  expect(inspectEvidence({ ...base, stats: { ...base.stats!, mk: { ...base.stats!.mk, p: NaN } } }, period).status).toBe("unavailable");
});
it("retains an eligible zero estimate and hides estimates for mismatches, gaps and other tiers", () => {
  const r = { ...result(0.1, 0.12, "not_proven"), verdict: { tier: "not_proven" as const, years_needed: 0, reason: null } };
  expect(inspectEvidence(r, period)).toMatchObject({ years_eligible: true, years_needed: 0 });
  expect(inspectEvidence({ ...r, yearly: r.yearly.filter((p) => p.year !== 2010), stats: { ...r.stats, n_years: 23 } }, period)).toMatchObject({ gapped_years: true, years_eligible: false });
  expect(inspectEvidence({ ...r, stats: { ...r.stats, ols: { ...r.stats.ols, p: 0.001 } , mk: { ...r.stats.mk, p: 0.001 } } }, period).years_eligible).toBe(false);
});
it("accepts exactly eighty percent coverage and rejects an impossible effective sample size", () => {
  const yearly = base.yearly.slice(0, 20);
  const r = { ...base, yearly, stats: { ...base.stats!, n_years: 20 } };
  expect(inspectEvidence(r, evidencePeriod("2002–2026", "ANN"))).toMatchObject({ coverage: 0.8, eligible: true });
  expect(inspectEvidence({ ...base, stats: { ...base.stats!, ols: { ...base.stats!.ols, n_eff: 25 } } }, period)).toMatchObject({ status: "unavailable", years_eligible: false });
});
it("supports the nullable OLS inference contract without fabricating agreement or years", () => {
  const r = { ...base, stats: { ...base.stats!, tests_agree: null, ols: { ...base.stats!.ols, n_eff: 2, p: null, se: null, ci_low: null, ci_high: null } } };
  expect(inspectEvidence(r, period)).toMatchObject({ status: "mk_only", p_ols: null, tests_disagree: false, years_needed: null });
  expect(inspectEvidence({ ...r, stats: { ...r.stats, ols: { ...r.stats.ols, n_eff: 20 } } }, period)).toMatchObject({ status: "unavailable", p_used: null });
});
