import type { RegionAnalysis, Variable } from "@/lib/api/types";
export function summarizeAnalysis(r: RegionAnalysis, v: Variable, regionName: string, period = "", season = "") {
  return { region: regionName, variable: v.name, unit: v.unit, period, season, n_years: r.stats?.n_years ?? null,
    stats: r.stats, verdict: r.verdict, provenance: r.provenance, warnings: r.warnings };
}
