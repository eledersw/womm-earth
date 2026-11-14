"use client";
import type { RegionAnalysis, TrendStats, Variable } from "@/lib/api/types";
import { useUiStore } from "@/lib/state/ui-store";
import { PredictPrompt } from "../PredictPrompt";
import { YearsMeter } from "../YearsMeter";
import { ExplainBox } from "@/components/partner/ExplainBox";
import type { ReadingLevel } from "@/lib/state/case-codec";
import { renderVerdict, testsDisagree, hasUsableYearsEstimate, type VerdictContext } from "@/lib/partner/verdict-templates";
import { fmtNumber, fmtP, fmtSlope } from "@/lib/partner/format";
import { caseCopy } from "@/lib/copy/case";
import { StepSection, type StepProps } from "./StepSection";

type Props = StepProps & { results?: RegionAnalysis[]; context?: Omit<VerdictContext, "regionName">; level?: ReadingLevel; ratioScale?: boolean; variable?: Variable; showExplanation?: boolean };
export function VerdictStep({ results, context, level = "student", ratioScale = false, variable, showExplanation = true, children, ...status }: Props) {
  const hidden = useUiStore((s) => s.predictMode && !s.reveal);
  const predict = useUiStore((s) => s.predictMode);
  const c = caseCopy.verdict;
  return <StepSection step="verdict" {...status}>
    {predict && !!results?.length && <PredictPrompt results={results} />}
    {!hidden && results?.length && context ? <div className="space-y-4">{results.map((r) => {
      const verdict = renderVerdict(r, { ...context, regionName: r.region.name }, level);
      return <article key={r.region.id} aria-label={`${r.region.name}: ${verdict.badge}`} className="rounded-lg border p-3">
        <h3 className="font-semibold">{r.region.name}: {verdict.badge}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{verdict.title}</p>
        {testsDisagree(r) && <p className="mt-2 text-sm font-semibold">{c.disagreeBadge}</p>}
        <p className="mt-2 text-sm">{verdict.body}</p>
        {r.stats && hasUsableYearsEstimate(r) && <YearsMeter nYears={r.stats.n_years} yearsNeeded={r.verdict.years_needed} />}
        {level === "scientist" && r.stats && <StatsTable stats={r.stats} unit={context.unit} ratioScale={ratioScale} />}
        {showExplanation && variable && r.verdict.tier !== "too_short" && <ExplainBox result={r} variable={variable} regionName={r.region.name} level={level} />}
      </article>;
    })}</div> : !hidden ? children : null}
  </StepSection>;
}
function StatsTable({ stats: s, unit, ratioScale }: { stats: TrendStats; unit: string; ratioScale: boolean }) {
  const c = caseCopy.verdict;
  return <div className="mt-3 overflow-x-auto">
    <table className="w-full text-left text-sm"><caption className="text-left font-medium">{c.table} · {unit}</caption>
      <thead><tr>{[c.method, c.slope, c.interval, c.p].map((label) => <th key={label} className="p-2">{label}</th>)}</tr></thead>
      <tbody>
        <tr><th scope="row">{c.ols}</th><td>{fmtSlope(s.ols.slope * 10)}</td><td>{fmtSlope(s.ols.ci_low * 10)} … {fmtSlope(s.ols.ci_high * 10)}</td><td>{fmtP(s.ols.p)}</td></tr>
        <tr><th scope="row">{c.mk}</th><td>—</td><td>—</td><td>{fmtP(s.mk.p)}</td></tr>
        <tr><th scope="row">{c.sen}</th><td>{fmtSlope(s.sen.slope * 10)}</td><td>{fmtSlope(s.sen.ci_low * 10)} … {fmtSlope(s.sen.ci_high * 10)}</td><td>—</td></tr>
      </tbody>
    </table>
    <dl className="mt-2 grid grid-cols-2 gap-1 text-sm">
      {[[c.n, String(s.n_years)], [c.effectiveN, fmtNumber(s.ols.n_eff)], [c.tau, fmtNumber(s.mk.tau)], [c.phi, fmtNumber(s.phi)], [c.total, `${fmtSlope(s.total_change)} ${unit}`], ...(ratioScale && s.pct_of_mean_per_decade != null ? [[c.percent, `${fmtSlope(s.pct_of_mean_per_decade)}%`]] : [])].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
  </div>;
}
