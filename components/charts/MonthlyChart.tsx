"use client";
import { displayUnit } from "@/components/globe/palette";
import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import type { RegionAnalysis } from "@/lib/api/types";
import { caseCopy } from "@/lib/copy/case";
import { PlotFigure } from "./PlotFigure";
import { seriesColors } from "./SeriesChart";

export function monthlyOptions(results: RegionAnalysis[], mode: "raw" | "anomaly", unit: string, width: number): Plot.PlotOptions {
  const data = results.flatMap((r) => r.monthly.map((p) => ({
    date: new Date(`${p.t}-01T00:00:00Z`), value: mode === "raw" ? p.value : p.anomaly,
    region: `${r.region.name} (${r.region.id})`,
  })));
  return {
    width, height: 260, marginBottom: 52, marginLeft: 58, ariaLabel: mode === "raw" ? caseCopy.evidence.monthlyChart : caseCopy.evidence.anomalyChart,
    x: { type: "utc", label: caseCopy.evidence.date }, y: { label: displayUnit(unit) },
    color: { domain: results.map((r) => `${r.region.name} (${r.region.id})`), range: seriesColors, legend: true },
    marks: [
      ...(mode === "anomaly" ? [Plot.ruleY([0], { strokeOpacity: 0.4 })] : []),
      Plot.lineY(data, { x: "date", y: "value", stroke: "region" }),
    ],
  };
}
export function MonthlyChart({ results, mode, unit = "" }: { results: RegionAnalysis[]; mode: "raw" | "anomaly"; unit?: string }) {
  const options = useMemo(() => (width: number) => monthlyOptions(results, mode, unit, width), [results, mode, unit]);
  return <PlotFigure options={options} label={mode === "raw" ? caseCopy.evidence.monthlyChart : caseCopy.evidence.anomalyChart}
    caption={`${mode === "anomaly" ? caseCopy.evidence.anomalyNote : caseCopy.evidence.annualTests} ${caseCopy.evidence.missing}`} />;
}
