"use client";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SeriesChart } from "@/components/charts/SeriesChart";
import { MonthlyChart } from "@/components/charts/MonthlyChart";
import type { RegionAnalysis } from "@/lib/api/types";
import { caseCopy } from "@/lib/copy/case";
import { StepSection, type StepProps } from "./StepSection";

type Props = StepProps & { results?: RegionAnalysis[]; unit?: string };
export function EvidenceStep({ results, unit = "", children, ...status }: Props) {
  const [view, setView] = useState("yearly");
  const [mode, setMode] = useState<"raw" | "anomaly">("raw");
  const c = caseCopy.evidence;
  return <StepSection step="evidence" {...status}>
    {results?.length ? <div className="space-y-4">
      <ToggleGroup type="single" variant="outline" value={view} aria-label={c.view} onValueChange={(value) => { if (value) setView(value); }}>
        <ToggleGroupItem value="yearly">{c.yearly}</ToggleGroupItem><ToggleGroupItem value="monthly">{c.monthly}</ToggleGroupItem>
      </ToggleGroup>
      {view === "monthly" && <ToggleGroup type="single" variant="outline" value={mode} aria-label={c.monthlyChart} onValueChange={(value) => { if (value === "raw" || value === "anomaly") setMode(value); }}>
        <ToggleGroupItem value="raw">{c.raw}</ToggleGroupItem><ToggleGroupItem value="anomaly">{c.anomaly}</ToggleGroupItem>
      </ToggleGroup>}
      {view === "yearly" ? <SeriesChart results={results} unit={unit} /> : <MonthlyChart results={results} unit={unit} mode={mode} />}
      <p className="text-sm text-muted-foreground">{c.annualTests} {c.seasonNote}</p>
      <ul aria-label={c.provenance} className="space-y-2 text-sm">
        {results.map((r) => <li key={r.region.id} className="rounded-md border p-2">
          <p className="font-medium">{r.region.name} · {caseCopy.controls.kinds[r.provenance.kind]}</p>
          <p>{r.provenance.source}{r.provenance.instrument ? ` · ${r.provenance.instrument}` : ""}{r.provenance.product ? ` · ${r.provenance.product}` : ""}</p>
          {r.provenance.doi && <p className="break-all">DOI: {r.provenance.doi}</p>}
          {!!r.warnings.length && <ul aria-label={c.warnings}>{r.warnings.map((warning, i) => <li key={i}>{warning === "tests_disagree" ? caseCopy.verdict.disagreeStudent : warning === "nearest_cell_fallback" ? caseCopy.controls.nearestCellFallback : warning}</li>)}</ul>}
        </li>)}
      </ul>
    </div> : children}
  </StepSection>;
}
