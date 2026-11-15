// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useUiStore } from "@/lib/state/ui-store";
import { DEFAULT_CASE } from "@/lib/state/case-codec";
import type { RegionAnalysis, Variable } from "@/lib/api/types";
import fixture from "@/api/_fixtures/analyze.json";
import correlation from "@/api/_fixtures/correlate.json";
import vars from "@/api/_fixtures/variables.json";
import { api } from "@/lib/api/client";
import { YearsMeter } from "./YearsMeter";
import { CorrelationView } from "./CorrelationView";
import { VerdictStep } from "./steps/VerdictStep";
vi.mock("@/lib/api/client", () => ({ api: { POST: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); useUiStore.setState({ highlight: { kind: null, regions: [], arcFrom: null } }); });
const state = { ...DEFAULT_CASE, regions: ["US-WI"], from: 2002 };
const result = fixture.results[0] as unknown as RegionAnalysis;
it("years meter shows conditional estimates including zero, and hides unavailable estimates", () => {
  const { rerender } = render(<YearsMeter nYears={24} yearsNeeded={12} />);
  expect(screen.getByRole("meter").getAttribute("max")).toBe("36");
  expect(screen.getByText(/assuming the slope and noise/)).toBeDefined();
  rerender(<YearsMeter nYears={24} yearsNeeded={0} />);
  expect(screen.getByText(/≈0 more years/)).toBeDefined();
  for (const years of [null, -1, 51, NaN]) { rerender(<YearsMeter nYears={24} yearsNeeded={years} />); expect(screen.queryByRole("meter")).toBeNull(); }
});
it("correlation uses first region/custom months, surfaces co-trending warning and separates raw/detrended results", async () => {
  vi.mocked(api.POST).mockResolvedValue({ data: correlation } as never);
  render(<CorrelationView state={{ ...state, regions: ["US-WI", "ESP"], season: "CUSTOM", months: [11, 12, 1] }} variables={vars as Variable[]} />);
  expect(api.POST).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "PRECTOTCORR" } });
  await screen.findByText("Both are trending, but that alone doesn't mean they're connected.");
  expect(screen.getByText("Raw Pearson r")).toBeDefined(); expect(screen.getByText("Detrended Pearson r")).toBeDefined();
  expect(api.POST).toHaveBeenCalledWith("/api/py/correlate", expect.objectContaining({ body: expect.objectContaining({ region: "US-WI", season: "CUSTOM", months: [11, 12, 1], max_lag: 6 }) }));
});
it("switching secondary variables aborts the previous correlation and hides its response", async () => {
  const pending: { signal: AbortSignal; resolve: (r: unknown) => void }[] = [];
  vi.mocked(api.POST).mockImplementation(((_path: string, options: { signal: AbortSignal }) => new Promise<unknown>((resolve) => pending.push({ signal: options.signal, resolve }))) as unknown as typeof api.POST);
  render(<CorrelationView state={state} variables={vars as Variable[]} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "PRECTOTCORR" } });
  await waitFor(() => expect(pending.length).toBe(1));
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "GWETROOT" } });
  await waitFor(() => expect(pending.length).toBe(2));
  expect(pending[0].signal.aborted).toBe(true);
  await act(async () => pending[0].resolve({ data: correlation }));
  expect(screen.queryByText("Both are trending, but that alone doesn't mean they're connected.")).toBeNull();
  await act(async () => pending[1].resolve({ data: { ...correlation, warning: null } }));
  expect(screen.getByText("Raw Pearson r")).toBeDefined();
});

it("years meter is restricted to not_proven with usable OLS uncertainty", () => {
  const stats = { ...result.stats!, mk: { ...result.stats!.mk, p: 0.1 }, resid_sd: 0.5, phi: 0.1, ols: { ...result.stats!.ols, p: 0.1, slope: 0.01, se: 0.1, n_eff: 20 } };
  const r = { ...result, stats, verdict: { tier: "not_proven" as const, years_needed: 12, reason: null } };
  const props = { context: { variableName: "Temperature", unit: "°C", period: "2002–2025", seasonLabel: "JJA" } };
  const { rerender } = render(<VerdictStep {...props} results={[r]} />);
  expect(screen.getByRole("meter")).toBeDefined();
  rerender(<VerdictStep {...props} results={[{ ...r, verdict: { ...r.verdict, tier: "confirmed" } }]} />);
  expect(screen.queryByRole("meter")).toBeNull();
  rerender(<VerdictStep {...props} results={[{ ...r, stats: { ...stats, ols: { ...stats.ols, n_eff: 2 } } }]} />);
  expect(screen.queryByRole("meter")).toBeNull();
});
