// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import fixture from "@/api/_fixtures/analyze.json";
import variables from "@/api/_fixtures/variables.json";
import { explainInputSchema } from "@/lib/partner/input";
import { ExplainBox } from "./ExplainBox";
vi.mock("@/lib/state/use-case", () => ({ useCase: () => ({ state: { variable: "T2M", regions: ["US-WI"], from: 2002, to: 2025, season: "JJA", months: null, level: "student" } }) }));
const input = explainInputSchema.parse({ mode: "explain", level: "student", analysis: fixture.results[0], variable: variables[0], regionName: "Wisconsin", period: "2002–2025", seasonLabel: "JJA" });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("streams a fresh explanation from Claude", async () => {
  const fetcher = vi.fn(async () => new Response('data: {"type":"text","text":"Fresh response."}\n\ndata: {"type":"done"}\n\n', { headers: { "content-type": "text/event-stream" } }));
  vi.stubGlobal("fetch", fetcher);
  render(<ExplainBox result={input.analysis} variable={input.variable} regionName="Wisconsin" level="student" />);
  await waitFor(() => expect(screen.getByText("Fresh response.")).toBeDefined());
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("keeps an inconsistent verdict provisional without requesting Claude", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  const result = { ...input.analysis, stats: { ...input.analysis.stats!, tests_agree: false, ols: { ...input.analysis.stats!.ols, p: 0.42 } } };
  render(<ExplainBox result={result} variable={input.variable} regionName="Wisconsin" level="student" />);
  expect(screen.getByRole("alert").textContent).toContain("provisional");
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
