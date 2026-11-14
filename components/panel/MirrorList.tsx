"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Region } from "@/lib/api/types";
import { caseKey, caseFromQuery } from "@/lib/state/case-codec";
import { useUiStore } from "@/lib/state/ui-store";
import { caseCopy } from "@/lib/copy/case";
import { fmtP, fmtSlope } from "@/lib/partner/format";
import { Button } from "@/components/ui/button";
import type { CaseControls } from "./controls";
import { useCaseResource } from "./useCaseResource";
export function MirrorList({ state, setCase, regions, unit }: CaseControls & { regions: Record<string, Region>; unit: string }) {
  const c = caseCopy.explorations; const key = caseKey(state); const base = state.regions[0];
  const [shown, setShown] = useState(false);
  const load = useCallback(async (signal: AbortSignal) => {
    const current = caseFromQuery(key);
    const { data, error } = await api.POST("/api/py/mirror", { body: { variable: current.variable, regions: [current.regions[0]], start: current.from, end: current.to, season: current.season, months: current.months }, signal });
    if (error || !data || !Array.isArray(data.mirrors) || data.base?.region !== current.regions[0]) throw new Error("mirror"); return data;
  }, [key]);
  const result = useCaseResource(key, load, !!base);
  useEffect(() => () => {
    const store = useUiStore.getState();
    if (store.highlight.kind === "mirror" && store.highlight.arcFrom === base) store.clearHighlight();
  }, [key, base]);
  const mirrors = result.data?.mirrors.slice(0, 3) ?? [];
  return <section aria-label={c.mirror} className="space-y-3 border-t border-hairline pt-4 text-panel">
    <h3 className="label-mono">{c.mirror}</h3><p className="text-scale">{c.mirrorHint}</p>
    {result.loading && <p role="status">{caseCopy.loading}</p>}
    {result.error && <div role="alert"><p>{result.error}</p><Button variant="outline" onClick={result.retry}>{caseCopy.retry}</Button></div>}
    {result.data && (result.data.none_found || !mirrors.length) ? <p>{caseCopy.empty.noMirror}</p> : null}
    {!result.data?.none_found && mirrors.length > 0 && <>
      <ul className="space-y-3">{mirrors.map((mirror) => <li key={mirror.region} className="border-b border-hairline pb-3">
        <p>{regions[mirror.region]?.name ?? mirror.region}</p>
        <p className="text-scale">{c.slope}: {fmtSlope(mirror.slope_per_decade)} {unit} · p {fmtP(mirror.p)}</p>
        <Button variant="outline" onClick={() => setCase({ regions: [base, mirror.region] })}>{c.compare} {regions[mirror.region]?.name ?? mirror.region}</Button>
      </li>)}</ul>
      <Button variant="outline" onClick={() => { useUiStore.getState().setHighlight({ kind: "mirror", regions: mirrors.map((m) => m.region), arcFrom: base }); setShown(true); }}>{c.showOnGlobe}</Button>
      {shown && <p role="status" className="text-scale">{c.highlighted}</p>}
    </>}
  </section>;
}
