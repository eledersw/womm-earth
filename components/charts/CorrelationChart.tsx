"use client";
import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import type { CorrelateResponse } from "@/lib/api/types";
import { PlotFigure } from "./PlotFigure";
import { caseCopy } from "@/lib/copy/case";
export function CorrelationChart({ data, xLabel, yLabel }: { data: CorrelateResponse; xLabel: string; yLabel: string }) {
  const c = caseCopy.explorations;
  const scatter = useMemo(() => (width: number): Plot.PlotOptions => ({ width, height: 260, ariaLabel: c.scatter,
    x: { label: xLabel }, y: { label: yLabel },
    marks: [Plot.dot(data.scatter, { x: "x", y: "y", stroke: "var(--series-1)" }),
      ...(data.scatter.length >= 3 ? [Plot.linearRegressionY(data.scatter, { x: "x", y: "y", stroke: "currentColor", ci: 0 })] : [])],
  }), [data.scatter, c.scatter, xLabel, yLabel]);
  const lags = useMemo(() => (width: number): Plot.PlotOptions => ({ width, height: 200, ariaLabel: c.lag,
    x: { label: c.lagAxis }, y: { label: c.r, domain: [-1, 1] },
    marks: [Plot.ruleY([0]), Plot.barY(data.lags, { x: "lag", y: "r", fill: "var(--series-1)" })],
  }), [data.lags, c.lag, c.lagAxis, c.r]);
  return <div className="space-y-3">
    {data.scatter.length ? <PlotFigure options={scatter} label={c.scatter} caption={c.scatterNote} /> : <p>{c.noScatter}</p>}
    {data.lags.some((p) => p.r != null) ? <PlotFigure options={lags} label={c.lag} caption={c.lagCaution} /> : <p>{c.noLags}</p>}
  </div>;
}
