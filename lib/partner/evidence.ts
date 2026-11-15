import type { RegionAnalysis } from "@/lib/api/types";
import { normalizeCase, type CaseState } from "@/lib/state/case-codec";
import { caseCopy } from "@/lib/copy/case";

export type EvidencePeriod = Pick<CaseState, "from" | "to" | "season" | "months">;
export const METHOD = { alpha: 0.05, confidence: 0.95, min_years: 10, min_coverage: 0.8, max_extra_years: 50, ols_ar_order: 1 } as const;
const validP = (p: unknown): p is number => typeof p === "number" && Number.isFinite(p) && p >= 0 && p <= 1;
const tierFor = (p: number) => p < METHOD.alpha ? "confirmed" : p < 0.2 ? "not_proven" : "no_case";

/** Parse existing display context without adding fields to the frozen HTTP contract. */
export function evidencePeriod(period: string, seasonLabel: string): EvidencePeriod | undefined {
  const years = /^(\d{4})[–-](\d{4})$/.exec(period);
  const label = seasonLabel.toUpperCase();
  const custom = /^CUSTOM \(([\d, ]+)\)$/.exec(label);
  // Accepts the codes (DJF) and the panel's display labels (Dec–Feb).
  const byLabel = Object.entries(caseCopy.controls.seasons).find(([, text]) => text.toUpperCase() === label)?.[0];
  const season = label === "ANNUAL" ? "ANN" : custom ? "CUSTOM" : byLabel ?? label;
  if (!years || !["ANN", "DJF", "MAM", "JJA", "SON", "CUSTOM"].includes(season) || (season === "CUSTOM" && !custom)) return;
  const from = Number(years[1]); const to = Number(years[2]);
  const normalized = normalizeCase({ from, to, season: season as CaseState["season"], months: custom ? custom[1].split(",").map(Number) : null });
  if (from > to || normalized.season !== season) return;
  return normalized;
}

/** A display/grounding guard, never an engine replacement or validity sign-off. */
export function inspectEvidence(r: RegionAnalysis, period?: EvidencePeriod) {
  const s = r.stats;
  const wraps = period?.season === "DJF" || (period?.season === "CUSTOM" && !!period.months?.some((m, i, a) => i > 0 && m < a[i - 1]));
  const first = period ? period.from + (wraps ? 1 : 0) : undefined;
  const slots = period ? Math.max(0, period.to - first! + 1) : null;
  const selected = r.yearly.filter((point) => first !== undefined && point.year >= first && point.year <= period!.to);
  const valid = selected.filter((point) => point.value !== null && Number.isFinite(point.value));
  const unique = new Set(selected.map((point) => point.year)).size === selected.length;
  const coverage = slots ? valid.length / slots : null;
  const eligible = !!period && unique && valid.length >= METHOD.min_years && coverage !== null && coverage >= METHOD.min_coverage;
  const countMatches = !!s && Number.isInteger(s.n_years) && s.n_years === valid.length;
  const mk = validP(s?.mk.p) ? s!.mk.p : null;
  const se = s?.ols.se;
  const ciLow = s?.ols.ci_low;
  const ciHigh = s?.ols.ci_high;
  const ols = s && s.ols.n_eff > 2 && s.ols.n_eff <= s.n_years && Number.isFinite(s.ols.n_eff) && validP(s.ols.p) &&
    typeof se === "number" && Number.isFinite(se) && se >= 0 &&
    typeof ciLow === "number" && Number.isFinite(ciLow) &&
    typeof ciHigh === "number" && Number.isFinite(ciHigh) && ciLow <= ciHigh ? s.ols.p : null;
  const disclosedFallback = !!s && Number.isFinite(s.ols.n_eff) && s.ols.n_eff <= 2 && mk !== null;
  const pUsed = mk !== null && ols !== null ? Math.max(mk, ols) : disclosedFallback ? mk : null;
  const expectedTier = !eligible ? "too_short" : pUsed === null ? null : tierFor(pUsed);
  const disagree = mk !== null && ols !== null && (mk < METHOD.alpha) !== (ols < METHOD.alpha);
  const agreementMismatch = mk !== null && ols !== null && !!s && (s.tests_agree !== !disagree || r.warnings.includes("tests_disagree") && !disagree);
  const mismatch = !!period && (expectedTier !== null && r.verdict.tier !== expectedTier || eligible && !!s && (!countMatches || agreementMismatch));
  const status = mismatch ? "mismatch" : !period ? "unavailable" : !eligible ? "ineligible" : !s || !countMatches || pUsed === null ? "unavailable" : disclosedFallback ? "mk_only" : "combined";
  const validYears = valid.map((p) => p.year).sort((a, b) => a - b);
  const gapped = validYears.some((year, i) => i > 0 && year !== validYears[i - 1] + 1);
  const years = r.verdict.years_needed;
  const yearsEligible = status === "combined" && !gapped && r.verdict.tier === "not_proven" && !!s && years != null && Number.isInteger(years) && years >= 0 && years <= METHOD.max_extra_years &&
    [s.ols.slope, s.ols.se, s.resid_sd, s.phi].every(Number.isFinite) && s.ols.slope !== 0 && s.ols.se !== null && s.ols.se > 0 && s.resid_sd > 0 && s.phi < 1;
  return { status, eligible, valid_years: valid.length, eligible_slots: slots, coverage, count_matches: countMatches, p_mk: mk, p_ols: ols, p_used: pUsed, tests_disagree: disagree, gapped_years: gapped, persistent: !!s && Number.isFinite(s.phi) && s.phi > 0.3, years_eligible: yearsEligible, years_needed: yearsEligible ? years : null };
}
