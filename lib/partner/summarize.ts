import type { RegionAnalysis, Variable } from "@/lib/api/types";
export function summarizeAnalysis(r: RegionAnalysis, v: Variable, regionName: string, period = "", season = "") {
  const magnitudePerDecade = r.stats ? Math.abs(r.stats.change_per_decade) : null;
  const detectionProbabilityPercent = r.verdict.years_needed === null ? null : 50;
  return { region: regionName, variable: v.name, unit: v.unit, period, season, n_years: r.stats?.n_years ?? null,
    significance_threshold: 0.05, confidence_level: 0.95,
    magnitude_per_decade: magnitudePerDecade,
    detection_probability_percent: detectionProbabilityPercent,
    stats: r.stats, verdict: r.verdict, provenance: r.provenance, warnings: r.warnings };
}
