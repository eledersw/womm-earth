import type { RegionAnalysis } from "@/lib/api/types";
import type { ReadingLevel } from "@/lib/state/case-codec";
import { caseCopy } from "@/lib/copy/case";
import { fmtP, fmtSlope } from "./format";
export type VerdictContext = { variableName: string; unit: string; regionName: string; period: string; seasonLabel: string };
export function testsDisagree(r: RegionAnalysis) {
  return r.warnings.includes("tests_disagree") || r.stats?.tests_agree === false;
}
export function hasUsableYearsEstimate(r: RegionAnalysis) {
  const s = r.stats; const years = r.verdict.years_needed;
  return r.verdict.tier === "not_proven" && !!s && years != null && Number.isInteger(years) && years >= 0 && years <= 50 &&
    [s.n_years, s.ols.n_eff, s.ols.se, s.ols.slope, s.resid_sd, s.phi].every(Number.isFinite) &&
    s.n_years >= 10 && s.ols.n_eff > 2 && s.ols.se > 0 && s.resid_sd > 0 && s.phi < 1 && s.ols.slope !== 0;
}
// Based on VERDICT_TEMPLATES.md; METHODS §§2–11 supply coverage, primary
// test, Sen headline and the conditional interpretation of detection time.
export function renderVerdict(r: RegionAnalysis, ctx: VerdictContext, level: ReadingLevel) {
  const c = caseCopy.verdict;
  const s = r.stats;
  const scientist = level === "scientist";
  let body: string;
  switch (r.verdict.tier) {
    case "confirmed": body = s ? (scientist ? c.confirmedScientist : c.confirmedStudent) : c.unavailable; break;
    case "not_proven": body = scientist ? c.notProvenScientist : c.notProvenStudent;
      body += " " + (hasUsableYearsEstimate(r) ? c.estimate : c.noEstimate); break;
    case "no_case": body = scientist ? c.noCaseScientist : c.noCaseStudent; break;
    case "too_short": body = scientist ? c.tooShortScientist : c.tooShortStudent; break;
  }
  if (s && scientist && r.verdict.tier !== "confirmed" && r.verdict.tier !== "too_short") body += ` ${c.mk}: p ${s.mk.p < 0.001 ? "" : "= "}${fmtP(s.mk.p)}.`;
  if (testsDisagree(r)) body += " " + (scientist ? c.disagreeScientist : c.disagreeStudent);
  const values: Record<string, string> = {
    variable: ctx.variableName, region: ctx.regionName, period: ctx.period, unit: ctx.unit,
    slope: s ? fmtSlope(s.change_per_decade) : "—", p: s ? `${s.mk.p < 0.001 ? "" : "= "}${fmtP(s.mk.p)}` : "—",
    olsP: s ? `${s.ols.p < 0.001 ? "" : "= "}${fmtP(s.ols.p)}` : "—",
    low: s ? fmtSlope(s.sen.ci_low * 10) : "—", high: s ? fmtSlope(s.sen.ci_high * 10) : "—",
    n: s ? String(s.n_years) : "—", years: String(r.verdict.years_needed ?? "—"), agreement: testsDisagree(r) ? c.disagrees : c.agrees,
  };
  return { badge: caseCopy.tiers[r.verdict.tier], title: `${ctx.regionName} · ${ctx.period} · ${ctx.seasonLabel}`, body: body.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "—") };
}
