"use client";
import { useCallback, useId, useState } from "react";
import { api } from "@/lib/api/client";
import type { Variable } from "@/lib/api/types";
import { caseKey, caseFromQuery, type CaseState } from "@/lib/state/case-codec";
import { caseCopy, variableLabel } from "@/lib/copy/case";
import { fmtNumber, fmtP } from "@/lib/partner/format";
import dynamic from "next/dynamic";
import { useCaseResource } from "./useCaseResource";
import { Button } from "@/components/ui/button";
const CorrelationChart = dynamic(() => import("@/components/charts/CorrelationChart").then((m) => m.CorrelationChart), { ssr: false });

type Props = { state: CaseState; variables: Variable[] };
export function CorrelationView(props: Props) {
  return <LiveCorrelationView {...props} />;
}
function LiveCorrelationView({ state, variables }: Props) {
  const id = useId(); const c = caseCopy.explorations;
  const [second, setSecond] = useState("");
  const key = caseKey(state);
  const load = useCallback(async (signal: AbortSignal) => {
    const current = caseFromQuery(key);
    const { data, error } = await api.POST("/api/py/correlate", { body: { var_x: current.variable, var_y: second, region: current.regions[0], start: current.from, end: current.to, season: current.season, months: current.months, max_lag: 6 }, signal });
    if (error || !data || !Array.isArray(data.scatter) || !Array.isArray(data.lags)) throw new Error("correlation"); return data;
  }, [key, second]);
  const result = useCaseResource(`${key}:${second}`, load, !!second && second !== state.variable && state.regions.length > 0);
  const first = variables.find((v) => v.id === state.variable); const other = variables.find((v) => v.id === second);
  const num = (value: number | null, probability = false) => value == null ? c.unavailable : probability ? fmtP(value) : fmtNumber(value);
  return <section aria-label={c.correlation} className="space-y-3 border-t border-hairline pt-4 text-panel">
    <h3 className="label-mono">{c.correlation}</h3>
    <p className="text-scale">{c.firstRegion}: {state.regions[0]}</p>
    <label htmlFor={id} className="label-mono">{c.secondVariable}</label>
    <select id={id} value={second} onChange={(e) => setSecond(e.target.value)} className="w-full min-w-0 border border-hairline bg-well p-2">
      <option value="">{c.chooseVariable}</option>
      {variables.filter((v) => v.id !== state.variable).map((v) => <option key={v.id} value={v.id}>{variableLabel(v)} ({v.unit})</option>)}
    </select>
    {result.loading && <p role="status">{caseCopy.loading}</p>}
    {result.error && <div role="alert"><p>{result.error}</p><Button variant="outline" onClick={result.retry}>{caseCopy.retry}</Button></div>}
    {result.data && <>
      {result.data.warning === "both_trending" && <p role="note">{c.bothTrending}</p>}
      <p>{c.causality}</p>
      <dl className="grid grid-cols-2 gap-3 text-scale">{[[c.raw, num(result.data.pearson_raw)], [c.detrended, num(result.data.pearson_detrended)], [c.effectiveN, num(result.data.n_eff)], [c.pRaw, num(result.data.p_raw, true)], [c.pDetrended, num(result.data.p_detrended, true)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd className="figure">{value}</dd></div>)}</dl>
      <CorrelationChart data={result.data} xLabel={`${first ? variableLabel(first) : state.variable} (${first?.unit ?? ""})`} yLabel={`${other ? variableLabel(other) : second} (${other?.unit ?? ""})`} />
    </>}
  </section>;
}
