"use client";

import { Suspense, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { caseCopy } from "@/lib/copy/case";
import { partnerCopy } from "@/lib/copy/partner";
import { useCase } from "@/lib/state/use-case";
import * as Plot from "@observablehq/plot";
import { PlotFigure } from "@/components/charts/PlotFigure";
import { LeadStep } from "./steps/LeadStep";
import { SceneStep } from "./steps/SceneStep";
import { TimelineStep } from "./steps/TimelineStep";
import { EvidenceStep } from "./steps/EvidenceStep";
import { VerdictStep } from "./steps/VerdictStep";
import { availableHere, clampPeriod } from "./controls";
import { useVariables } from "./useVariables";
import { useRegions } from "./useRegions";
import { useAnalysis } from "./useAnalysis";

// No props: the page owns the slot. Search params stay inside this boundary.
export function CasePanel() {
  return <Suspense fallback={<p role="status">{caseCopy.loading}</p>}><CasePanelContent /></Suspense>;
}

function CasePanelContent() {
  const { state, setCase } = useCase();
  const variables = useVariables();
  const regions = useRegions();
  const variable = variables.byId[state.variable];
  const period = variable ? clampPeriod(state.from, state.to, variable) : null;
  const inPeriod = period?.from === state.from && period?.to === state.to;
  const valid = !!variable && inPeriod && !regions.loading && !regions.error && availableHere(state.variable, state.regions, regions.byId);
  const analysis = useAnalysis(state, valid);

  // Shared links may predate the catalogue or exceed the selected variable's
  // coverage. Correct the URL before issuing an analysis request.
  useEffect(() => {
    if (variable && (state.from < variable.start_year || state.to > variable.end_year || state.to < variable.start_year || state.from > variable.end_year)) {
      setCase(clampPeriod(state.from, state.to, variable));
    }
  }, [variable, state.from, state.to, setCase]);

  const chartOptions = useMemo(() => {
    const yearly = analysis.data?.results.flatMap((result) => result.yearly.map((point) => ({ ...point, region: result.region.name }))) ?? [];
    return (width: number): Plot.PlotOptions => ({
      width, height: 240, ariaLabel: caseCopy.controls.chart,
      x: { label: caseCopy.controls.year, tickFormat: "d" }, y: { label: variable?.unit },
      color: { legend: true, ...(analysis.data?.results.length === 1 ? { range: ["currentColor"] } : {}) },
      marks: [Plot.lineY(yearly, { x: "year", y: "value", stroke: "region" }), Plot.dot(yearly, { x: "year", y: "value", stroke: "region" })],
    });
  }, [analysis.data, variable?.unit]);
  const controls = { state, setCase };
  return (
    <section aria-label={caseCopy.panel} className="w-full min-w-0">
      <Tabs defaultValue="case">
        <TabsList aria-label={caseCopy.tabs} className="w-full">
          <TabsTrigger value="case">{caseCopy.caseTab}</TabsTrigger>
          <TabsTrigger value="partner">{caseCopy.partnerTab}</TabsTrigger>
        </TabsList>
        <TabsContent value="case" className="pt-2">
          <ol aria-label={caseCopy.stepsLabel} className="space-y-3">
            <li><LeadStep {...controls} variables={variables.variables} regions={regions.byId}
              loading={variables.loading || regions.loading} error={!!variables.error || !!regions.error}
              onRetry={() => { variables.retry(); regions.retry(); }} /></li>
            <li><SceneStep {...controls} regions={regions.byId} loading={regions.loading} error={!!regions.error} onRetry={regions.retry} /></li>
            <li><TimelineStep {...controls} variable={variable} loading={variables.loading} error={!!variables.error} onRetry={variables.retry} /></li>
            <li><EvidenceStep loading={analysis.loading} error={!!analysis.error} onRetry={analysis.retry}>
              {analysis.data ? <>
                <PlotFigure options={chartOptions} label={caseCopy.controls.chart} />
                {analysis.data.results.map((result) => <div key={result.region.id} className="mt-3 text-sm">
                  <p>{result.region.name} · {caseCopy.controls.yearlyValues}: {result.yearly.length}</p>
                  <p className="text-muted-foreground">{caseCopy.controls.source}: {result.provenance.source} · {caseCopy.controls.kinds[result.provenance.kind]}</p>
                </div>)}
              </> : <p className="text-sm text-muted-foreground">{state.regions.length && !valid ? caseCopy.controls.catalogRequired : caseCopy.steps.evidence.empty}</p>}
            </EvidenceStep></li>
            <li><VerdictStep loading={analysis.loading} error={!!analysis.error} onRetry={analysis.retry}>
              {analysis.data ? <ul className="space-y-1">{analysis.data.results.map((result) => <li key={result.region.id}>
                {result.region.name}: {caseCopy.tiers[result.verdict.tier]}
              </li>)}</ul> : null}
            </VerdictStep></li>
          </ol>
        </TabsContent>
        <TabsContent value="partner" className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">{partnerCopy.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{partnerCopy.offline}</p>
        </TabsContent>
      </Tabs>
    </section>
  );
}
