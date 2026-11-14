import type { RegionAnalysis, Variable } from "@/lib/api/types";
import { evidencePeriod, inspectEvidence, METHOD } from "./evidence";
import cards from "./process-cards.json";

/** Trusted, labelled display metadata alongside the engine's reported tier. No series arrays. */
export function summarizeAnalysis(r: RegionAnalysis, v: Variable, regionName: string, period = "", season = "") {
  const context = evidencePeriod(period, season);
  const evidence = inspectEvidence(r, context);
  const allowed = evidence.eligible && evidence.count_matches && evidence.status !== "unavailable";
  const percentAllowed = v.ratio_scale && !/^°?C$/i.test(v.unit.trim()) && r.stats && Number.isFinite(r.stats.period_mean) && Math.abs(r.stats.period_mean) > 1e-9;
  const stats = allowed && r.stats ? { ...r.stats,
    pct_of_mean_per_decade: percentAllowed ? r.stats.pct_of_mean_per_decade : null,
    ols: evidence.p_ols !== null ? r.stats.ols : null,
    mk: evidence.p_mk !== null ? r.stats.mk : null,
    tests_agree: evidence.p_ols !== null && evidence.p_mk !== null ? !evidence.tests_disagree : null,
  } : null;
  const safeReason = ["no_data", "insufficient_years", "missing_years"].includes(r.verdict.reason ?? "") ? r.verdict.reason : null;
  return { region: regionName, region_id: r.region.id, variable: v.name, variable_id: v.id, unit: v.unit, period, season,
    months: context?.months ?? null, n_years: evidence.valid_years,
    significance_threshold: METHOD.alpha, confidence_level: METHOD.confidence, method_settings: METHOD,
    display_evidence: { ...evidence, p_mk: allowed ? evidence.p_mk : null, p_ols: allowed ? evidence.p_ols : null, p_used: allowed ? evidence.p_used : null },
    sen_ci_per_decade: allowed && r.stats && [r.stats.sen.ci_low, r.stats.sen.ci_high].every(Number.isFinite) ? { low: r.stats.sen.ci_low * 10, high: r.stats.sen.ci_high * 10, unit: `${v.unit}/decade` } : null,
    magnitude_per_decade: stats && Number.isFinite(stats.change_per_decade) ? Math.abs(stats.change_per_decade) : null,
    // METHODS §10 does not establish 50% power for the combined rule.
    detection_probability_percent: null,
    stats, verdict: { ...r.verdict, reason: safeReason, years_needed: evidence.years_needed },
    provenance: r.provenance, warnings: r.warnings,
    process_cards: cards.filter((card) => card.applies_to.variables.includes(v.id) && card.applies_to.regions.includes(r.region.id)),
  };
}
