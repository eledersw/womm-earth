// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import fixture from "@/api/_fixtures/analyze.json";
import variables from "@/api/_fixtures/variables.json";
import { explainInputSchema } from "@/lib/partner/input";
import { ExplainBox } from "./ExplainBox";
const mock = vi.hoisted(() => ({ cache: {} as Record<string, unknown> }));
vi.mock("@/lib/partner/demo-explanations.json", () => ({ default: mock.cache }));
vi.mock("@/lib/state/use-case", () => ({ useCase: () => ({ state: { variable: "T2M", regions: ["US-WI"], from: 2002, to: 2025, season: "JJA", months: null, level: "student" } }) }));
const input = explainInputSchema.parse({ mode: "explain", level: "student", analysis: fixture.results[0], variable: variables[0], regionName: "Wisconsin", period: "2002–2025", seasonLabel: "JJA" });
const key = "v=T2M&r=US-WI&from=2002&to=2025&s=JJA";
const entry = { student: "Reviewed student explanation.", scientist: "Reviewed scientist explanation.", generated_at: "2026-11-14T18:00:00Z", approved_by: "methods-lead" };
afterEach(() => { cleanup(); delete mock.cache[key]; vi.unstubAllGlobals(); });
it("renders reviewed cached explanations instantly at both levels without requesting Claude", async () => {
  mock.cache[key] = entry;
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  const { rerender } = render(<ExplainBox result={input.analysis} variable={input.variable} regionName="Wisconsin" level="student" />);
  expect(screen.getByText(entry.student)).toBeDefined();
  rerender(<ExplainBox result={input.analysis} variable={input.variable} regionName="Wisconsin" level="scientist" />);
  expect(screen.getByText(entry.scientist)).toBeDefined();
  await Promise.resolve();
  expect(fetcher).not.toHaveBeenCalled();
});
it("uses streaming when a generated cache entry is still awaiting Sergio's approval", async () => {
  mock.cache[key] = { ...entry, approved_by: null };
  const fetcher = vi.fn(async () => new Response('data: {"type":"text","text":"Fresh response."}\n\ndata: {"type":"done"}\n\n', { headers: { "content-type": "text/event-stream" } }));
  vi.stubGlobal("fetch", fetcher);
  render(<ExplainBox result={input.analysis} variable={input.variable} regionName="Wisconsin" level="student" />);
  await waitFor(() => expect(screen.getByText("Fresh response.")).toBeDefined());
  expect(screen.queryByText(entry.student)).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("keeps an inconsistent verdict provisional even when an approved cache entry exists", async () => {
  mock.cache[key] = entry;
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  const result = { ...input.analysis, stats: { ...input.analysis.stats!, tests_agree: false, ols: { ...input.analysis.stats!.ols, p: 0.42 } } };
  render(<ExplainBox result={result} variable={input.variable} regionName="Wisconsin" level="student" />);
  expect(screen.getByRole("alert").textContent).toContain("provisional");
  expect(screen.queryByText(entry.student)).toBeNull();
  await Promise.resolve();
  expect(fetcher).not.toHaveBeenCalled();
});
it("withholds automatic Explain when yearly coverage is insufficient", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  render(<ExplainBox result={{ ...input.analysis, yearly: input.analysis.yearly.slice(0, 2) }} variable={input.variable} regionName="Wisconsin" level="student" />);
  expect(screen.getByRole("alert").textContent).toContain("provisional");
  await Promise.resolve();
  expect(fetcher).not.toHaveBeenCalled();
});
