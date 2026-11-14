"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { caseCopy } from "@/lib/copy/case";
import { partnerCopy } from "@/lib/copy/partner";
import * as Plot from "@observablehq/plot";
import analyzeFixture from "@/api/_fixtures/analyze.json";
import variableFixtures from "@/api/_fixtures/variables.json";
import { PlotFigure } from "@/components/charts/PlotFigure";
import { LeadStep } from "./steps/LeadStep";
import { SceneStep } from "./steps/SceneStep";
import { TimelineStep } from "./steps/TimelineStep";
import { EvidenceStep } from "./steps/EvidenceStep";
import { VerdictStep } from "./steps/VerdictStep";

// Read-only official fixtures for Task 1. Task 2 replaces these imports with
// useCase and the shared typed API client; no parallel case state is created.
const fixtureCase = analyzeFixture.case;
const variable = variableFixtures.find((entry) => entry.id === fixtureCase.variable);
const yearly = analyzeFixture.results.flatMap((result) => result.yearly.map((point) => ({
  ...point, region: result.region.name,
})));
const chartOptions = (width: number): Plot.PlotOptions => ({
  width,
  height: 240,
  ariaLabel: caseCopy.fixture.chart,
  x: { label: caseCopy.fixture.year, tickFormat: "d" },
  y: { label: variable?.unit ?? fixtureCase.variable },
  // This single-region preview inherits the foreground token for contrast.
  color: { legend: true, range: ["currentColor"] },
  marks: [
    Plot.lineY(yearly, { x: "year", y: "value", stroke: "region" }),
    Plot.dot(yearly, { x: "year", y: "value", stroke: "region" }),
  ],
});

// No props: the page owns the slot.
export function CasePanel() {
  return (
    <section aria-label={caseCopy.panel} className="w-full min-w-0">
      <Tabs defaultValue="case">
        <TabsList aria-label={caseCopy.tabs} className="w-full">
          <TabsTrigger value="case">{caseCopy.caseTab}</TabsTrigger>
          <TabsTrigger value="partner">{caseCopy.partnerTab}</TabsTrigger>
        </TabsList>
        <TabsContent value="case" className="pt-2">
          <aside className="mb-3 rounded-xl border bg-muted p-4 text-sm" aria-label={caseCopy.fixture.notice}>
            <p className="font-semibold">{caseCopy.fixture.notice}</p>
            <p className="mt-1 text-muted-foreground">{caseCopy.fixture.disclaimer}</p>
          </aside>
          <ol aria-label={caseCopy.stepsLabel} className="space-y-3">
            <li><LeadStep>
              <p className="font-medium">{variable?.name ?? fixtureCase.variable} ({fixtureCase.variable})</p>
              {variable ? <p className="mt-1 text-sm">{variable.definition_student}</p> : null}
            </LeadStep></li>
            <li><SceneStep>
              <ul className="flex flex-wrap gap-2">
                {analyzeFixture.results.map(({ region }) => (
                  <li key={region.id} className="rounded-md border px-2 py-1 text-sm">{region.name} ({region.id})</li>
                ))}
              </ul>
            </SceneStep></li>
            <li><TimelineStep>
              <p>{fixtureCase.start}–{fixtureCase.end} · {fixtureCase.season}</p>
            </TimelineStep></li>
            <li><EvidenceStep>
              <PlotFigure options={chartOptions} label={caseCopy.fixture.chart} caption={caseCopy.fixture.caption} />
              {analyzeFixture.results.map((result) => (
                <div key={result.region.id} className="mt-3 text-sm">
                  <p>{result.region.name} · {caseCopy.fixture.yearlyValues}: {result.yearly.length}</p>
                  <p className="text-muted-foreground">
                    {caseCopy.fixture.source}: {result.provenance.source} · {result.provenance.kind === "satellite"
                      ? caseCopy.fixture.kinds.satellite : caseCopy.fixture.kinds.reanalysis}
                  </p>
                </div>
              ))}
            </EvidenceStep></li>
            <li><VerdictStep>
              <p className="text-sm text-muted-foreground">{caseCopy.fixture.verdict}</p>
              <ul className="mt-2 space-y-1">
                {analyzeFixture.results.map((result) => (
                  <li key={result.region.id}>
                    {result.region.name}: {Object.entries(caseCopy.tiers).find(([tier]) => tier === result.verdict.tier)?.[1] ?? result.verdict.tier}
                  </li>
                ))}
              </ul>
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
