// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { RegionAnalysis } from "@/lib/api/types";
import fixture from "@/api/_fixtures/analyze.json";
import { VerdictStep } from "./VerdictStep";
const base = fixture.results[0] as unknown as RegionAnalysis;
const context = { variableName: "Air temperature", unit: "°C", period: "2002–2025", seasonLabel: "JJA" };
afterEach(cleanup);
it("shows the Scientist table and gates percentages by ratio scale", () => {
  const r = { ...base, stats: { ...base.stats!, pct_of_mean_per_decade: 2 } };
  const { rerender } = render(<VerdictStep results={[r]} context={context} level="scientist" />);
  expect(screen.getByRole("table")).toBeDefined();
  expect(screen.queryByText("% of period mean per decade")).toBeNull();
  rerender(<VerdictStep results={[r]} context={{ ...context, unit: "mm/day" }} level="scientist" ratioScale />);
  expect(screen.getByText("% of period mean per decade")).toBeDefined();
  rerender(<VerdictStep results={[r]} context={context} level="student" />);
  expect(screen.queryByRole("table")).toBeNull();
});
it("renders one card per region and keeps too-short series usable without statistics", () => {
  render(<VerdictStep results={[base, { ...base, region: { ...base.region, id: "ESP", name: "Spain" }, stats: null, verdict: { tier: "too_short", years_needed: null, reason: null } }]} context={context} level="scientist" />);
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.getByRole("heading", { name: "Spain: Too short to judge" })).toBeDefined();
});
it("withholds scientific tables and Explain for failed eligibility despite a reported Confirmed", () => {
  render(<VerdictStep results={[{ ...base, yearly: base.yearly.slice(0, 2) }]} context={context} level="scientist" />);
  expect(screen.getByRole("heading", { name: "Wisconsin: Confirmed" })).toBeDefined();
  expect(screen.getByText(/Treat this result as provisional/)).toBeDefined();
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByRole("region", { name: "Explain this verdict" })).toBeNull();
});
it("never presents an unavailable adjusted OLS p-value as observed inference", () => {
  render(<VerdictStep results={[{ ...base, stats: { ...base.stats!, ols: { ...base.stats!.ols, n_eff: 2 } } }]} context={context} level="scientist" />);
  expect(screen.getByText(/disclosed capped-MK-only fallback/)).toBeDefined();
  expect(screen.getAllByText("Statistics are unavailable for this Case.")).toHaveLength(2);
});
it("compact cards keep magnitude visible and retain the reviewed interpretation in details", () => {
  render(<VerdictStep compact results={[base]} context={context} />);
  expect(screen.getByText(/Sen slope .*approximate 95% CI/)).toBeDefined();
  expect(screen.getByText("Methods and limitations").closest("details")).toBeDefined();
  expect(screen.getByText(/The estimated change is/).closest("details")).not.toBeNull();
});
it("compact mode never hides provisional evidence notices behind details", () => {
  const r = { ...base, stats: { ...base.stats!, tests_agree: false, ols: { ...base.stats!.ols, p: 0.42 } } };
  render(<VerdictStep compact results={[r]} context={context} />);
  const notice = screen.getByText(/Treat this result as provisional/);
  expect(notice.closest("details")).toBeNull();
  expect(screen.queryByText("Methods and limitations")).toBeNull();
});
