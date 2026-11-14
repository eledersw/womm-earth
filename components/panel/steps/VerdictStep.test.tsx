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
  rerender(<VerdictStep results={[r]} context={context} level="scientist" ratioScale />);
  expect(screen.getByText("% of period mean per decade")).toBeDefined();
  rerender(<VerdictStep results={[r]} context={context} level="student" />);
  expect(screen.queryByRole("table")).toBeNull();
});
it("renders one card per region and keeps too-short series usable without statistics", () => {
  render(<VerdictStep results={[base, { ...base, region: { ...base.region, id: "ESP", name: "Spain" }, stats: null, verdict: { tier: "too_short", years_needed: null, reason: null } }]} context={context} level="scientist" />);
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.getByRole("heading", { name: "Spain: Too short to judge" })).toBeDefined();
});
