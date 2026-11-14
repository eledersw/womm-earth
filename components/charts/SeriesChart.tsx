"use client";
import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import type { RegionAnalysis } from "@/lib/api/types";
import { caseCopy } from "@/lib/copy/case";
import { PlotFigure } from "./PlotFigure";

// Tokens land with the shell. These readable fallbacks keep comparisons distinct
// until then; PlotFigure redraws them when the theme changes.
export const seriesColors = ["var(--series-1, #2563eb)", "var(--series-2, #c2410c)", "var(--series-3, #15803d)", "var(--series-4, #a855f7)"];
export function yearlyOptions(results: RegionAnalysis[], unit: string, width: number): Plot.PlotOptions {
  const yearly = results.flatMap((r) => r.yearly.map((p) => ({ ...p, region: `${r.region.name} (${r.region.id})` })));
  const fit = results.flatMap((r) => r.fit.map((p) => ({ ...p, region: `${r.region.name} (${r.region.id})` })));
  return {
    width, height: 300, ariaLabel: caseCopy.controls.chart,
    x: { label: caseCopy.controls.year, tickFormat: "d" }, y: { label: unit },
    color: { domain: results.map((r) => `${r.region.name} (${r.region.id})`), range: seriesColors, legend: true },
    marks: [
      Plot.areaY(fit, { x: "year", y1: "ols_low", y2: "ols_high", fill: "region", fillOpacity: 0.2 }),
      Plot.lineY(yearly, { x: "year", y: "value", stroke: "region", strokeOpacity: 0.65 }),
      Plot.dot(yearly, { x: "year", y: "value", stroke: "region" }),
      Plot.lineY(fit, { x: "year", y: "ols", stroke: "region", strokeWidth: 2 }),
      Plot.lineY(fit, { x: "year", y: "sen", stroke: "region", strokeDasharray: "6,4", strokeWidth: 2 }),
    ],
  };
}
export function SeriesChart({ results, unit }: { results: RegionAnalysis[]; unit: string }) {
  const options = useMemo(() => (width: number) => yearlyOptions(results, unit, width), [results, unit]);
  return <PlotFigure options={options} label={caseCopy.controls.chart} caption={`${caseCopy.evidence.fits} ${caseCopy.evidence.missing}`} />;
}
