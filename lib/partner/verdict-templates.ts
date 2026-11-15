import { displayUnit } from "@/components/globe/palette";
import type { RegionAnalysis } from "@/lib/api/types";
import type { ReadingLevel } from "@/lib/state/case-codec";
import { caseCopy } from "@/lib/copy/case";
import { fmtP, fmtSlope } from "./format";
import { evidencePeriod, inspectEvidence, METHOD } from "./evidence";
export type VerdictContext = { variableName: string; unit: string; regionName: string; period: string; seasonLabel: string };
export function testsDisagree(r: RegionAnalysis) {
  return inspectEvidence(r).tests_disagree;
}
export function hasUsableYearsEstimate(r: RegionAnalysis, ctx?: Pick<VerdictContext, "period" | "seasonLabel">) {
  return inspectEvidence(r, ctx ? evidencePeriod(ctx.period, ctx.seasonLabel) : undefined).years_eligible;
}
const pText = (p: number | null) => p === null ? "" : `${p < 0.001 ? "" : "= "}${fmtP(p)}`;

/** Preserve the reported badge; mismatches with METHODS are provisional, never silently relabelled. */
export function renderVerdict(r: RegionAnalysis, ctx: VerdictContext, level: ReadingLevel) {
  const c = caseCopy.verdict; const s = r.stats; const scientist = level === "scientist";
  const e = inspectEvidence(r, evidencePeriod(ctx.period, ctx.seasonLabel));
  let body: string;
  if (e.status === "mismatch") body = c.mismatch;
  else if (e.status === "ineligible") body = scientist ? c.tooShortScientist : c.tooShortStudent;
  else if (e.status === "unavailable") body = scientist ? c.unavailableScientist : c.unavailableStudent;
  else if (e.status === "mk_only") body = scientist ? c.fallbackScientist : c.fallbackStudent;
  else {
    switch (r.verdict.tier) {
      case "confirmed": body = scientist ? c.confirmedScientist : c.confirmedStudent; break;
      case "not_proven": body = scientist ? c.notProvenScientist : c.notProvenStudent; break;
      case "no_case": body = scientist ? c.noCaseScientist : c.noCaseStudent; break;
      case "too_short": body = scientist ? c.tooShortScientist : c.tooShortStudent; break;
    }
    body += " " + (scientist ? c.evidenceScientist : c.evidenceStudent);
  }
  if (e.tests_disagree && e.status === "combined") body += " " + (scientist ? c.disagreeScientist : c.disagreeStudent);
  if (e.persistent && e.eligible) body += " " + (scientist ? c.persistentScientist : c.persistentStudent);
  if (e.gapped_years) body += " " + c.gaps;
  if (r.verdict.tier === "not_proven") {
    body += " " + (e.years_eligible ? scientist ? c.estimateScientist : c.estimate : c.noEstimate);
    if (e.years_eligible && e.years_needed === 0) body += " " + c.zeroEstimate;
  }
  // Unknown reason strings never pass through into scientific UI or prompts.
  const reasons = scientist ? c.reasonsScientist : c.reasonsStudent;
  const reason = r.verdict.reason && Object.hasOwn(reasons, r.verdict.reason) ? reasons[r.verdict.reason as keyof typeof reasons] : reasons.unknown;
  const finite = (x: number | undefined) => x !== undefined && Number.isFinite(x) ? fmtSlope(x) : "";
  const values: Record<string, string> = {
    badge: caseCopy.tiers[r.verdict.tier], variable: ctx.variableName, region: ctx.regionName, period: ctx.period, unit: ctx.unit === "1" ? caseCopy.controls.dimensionless : displayUnit(ctx.unit),
    slope: finite(s?.change_per_decade), p: pText(e.p_mk), olsP: pText(e.p_ols), p_used: pText(e.p_used),
    low: finite(s ? s.sen.ci_low * 10 : undefined), high: finite(s ? s.sen.ci_high * 10 : undefined),
    n: String(e.valid_years), years: String(e.years_needed ?? ""), reason,
    alpha: String(METHOD.alpha), confidence: `${METHOD.confidence * 100}%`, min_years: String(METHOD.min_years), min_coverage: `${METHOD.min_coverage * 100}%`,
  };
  // Optional scientific sentences with unavailable inputs are omitted whole.
  body = body.split(/(?<=\.) /).filter((sentence) => [...sentence.matchAll(/\{(\w+)\}/g)].every(([, key]) => values[key] !== undefined && values[key] !== "")).join(" ");
  const magnitude = e.status === "combined" && ["slope", "low", "high", "unit"].every((key) => values[key] !== "") && !!s && s.sen.ci_low <= s.sen.ci_high
    ? c.magnitude.replace(/\{(\w+)\}/g, (_, key: string) => values[key]) : null;
  return { magnitude, badge: caseCopy.tiers[r.verdict.tier], title: `${ctx.regionName} · ${ctx.variableName} · ${ctx.period} · ${ctx.seasonLabel}`, body: body.replace(/\{(\w+)\}/g, (_, key: string) => values[key]), evidence: e };
}
