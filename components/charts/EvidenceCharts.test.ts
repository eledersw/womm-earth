// @vitest-environment jsdom
import * as Plot from "@observablehq/plot";
import { expect, it } from "vitest";
import fixture from "@/api/_fixtures/analyze.json";
import type { RegionAnalysis } from "@/lib/api/types";
import { yearlyOptions } from "./SeriesChart";
import { monthlyOptions } from "./MonthlyChart";
const base = fixture.results[0] as unknown as RegionAnalysis;
it("renders four distinct region series, confidence bands and dashed Sen fits", () => {
  const results = Array.from({ length: 4 }, (_, i) => ({ ...base, region: { ...base.region, id: `R${i}`, name: `Region ${i}` } }));
  const chart = Plot.plot(yearlyOptions(results, "°C", 800));
  expect(chart.textContent).toContain("Region 3 (R3)");
  expect(chart.querySelectorAll('g[aria-label="area"] path')).toHaveLength(4);
  expect(chart.querySelectorAll('g[aria-label="line"][stroke-dasharray] path')).toHaveLength(4);
});
it("preserves gaps in yearly values rather than joining across missing data", () => {
  const result = { ...base, fit: [], yearly: [{ year: 2000, value: 1 }, { year: 2001, value: null }, { year: 2002, value: 3 }] };
  const chart = Plot.plot(yearlyOptions([result], "°C", 800));
  const path = chart.querySelector('g[aria-label="line"] path')?.getAttribute("d");
  expect(path?.match(/M/g)).toHaveLength(2);
});
it("plots server-provided anomalies without recomputing them", () => {
  const result = { ...base, monthly: [{ t: "2000-01", value: 100, anomaly: -2 }, { t: "2000-02", value: null, anomaly: null }, { t: "2000-03", value: 300, anomaly: 4 }] };
  const config = monthlyOptions([result], "anomaly", "°C", 800);
  const chart = Plot.plot(config);
  expect(chart.scale("y")?.domain).toEqual([-2, 4]);
  expect(chart.querySelector('g[aria-label="line"] path')?.getAttribute("d")?.match(/M/g)).toHaveLength(2);
});
it("never plots unavailable OLS interval bounds as zero", () => {
  const result = { ...base, fit: base.fit.map((p) => ({ ...p, ols_low: null, ols_high: null })) };
  const chart = Plot.plot(yearlyOptions([result], "C", 800));
  expect(chart.textContent).toContain("°C");
  const [low] = chart.scale("y")!.domain as number[];
  expect(low).toBeGreaterThan(0);
  for (const path of chart.querySelectorAll('g[aria-label="area"] path')) expect(path.getAttribute("d") ?? "").not.toMatch(/[ML]/);
});
