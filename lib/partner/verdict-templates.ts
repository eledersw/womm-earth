import type { RegionAnalysis } from "@/lib/api/types";
import type { ReadingLevel } from "@/lib/state/case-codec";
import { caseCopy } from "@/lib/copy/case";
import { fmtP, fmtSlope } from "./format";
export type VerdictContext = { variableName: string; unit: string; regionName: string; period: string; seasonLabel: string };
export function testsDisagree(r: RegionAnalysis) {
  return r.warnings.includes("tests_disagree") || r.stats?.tests_agree === false;
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
      body += " " + (r.verdict.years_needed != null && Number.isFinite(r.verdict.years_needed) ? c.estimate : c.noEstimate); break;
    case "no_case": body = scientist ? c.noCaseScientist : c.noCaseStudent; break;
    case "too_short": body = scientist ? c.tooShortScientist : c.tooShortStudent; break;
  }
  if (s && scientist && r.verdict.tier !== "confirmed" && r.verdict.tier !== "too_short") body += ` ${c.mk}: p ${s.mk.p < 0.001 ? "" : "= "}${fmtP(s.mk.p)}.`;
  if (testsDisagree(r)) body += " " + (scientist ? c.disagreeScientist : c.disagreeStudent);
  const values: Record<string, string> = {
    variable: ctx.variableName, region: ctx.regionName, period: ctx.period, unit: ctx.unit,
    slope: s ? fmtSlope(s.change_per_decade) : "—", p: s ? `${s.mk.p < 0.001 ? "" : "= "}${fmtP(s.mk.p)}` : "—",
    low: s ? fmtSlope(s.sen.ci_low * 10) : "—", high: s ? fmtSlope(s.sen.ci_high * 10) : "—",
    n: s ? String(s.n_years) : "—", years: String(r.verdict.years_needed ?? "—"), agreement: testsDisagree(r) ? c.disagrees : c.agrees,
  };
  return { badge: caseCopy.tiers[r.verdict.tier], title: `${ctx.regionName} · ${ctx.period} · ${ctx.seasonLabel}`, body: body.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "—") };
}
