// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { withNuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CasePanel } from "./CasePanel";
import { EvidenceStep } from "./steps/EvidenceStep";
import { caseCopy } from "@/lib/copy/case";
import { partnerCopy } from "@/lib/copy/partner";
import fixture from "@/api/_fixtures/analyze.json";
import variables from "@/api/_fixtures/variables.json";
import regions from "@/api/_fixtures/regions.json";
import { api } from "@/lib/api/client";

vi.mock("@/lib/api/client", () => ({ api: {
  GET: vi.fn(async (path: string) => ({ data: path.endsWith("variables") ? variables : regions })),
  POST: vi.fn(async () => ({ data: fixture })),
} }));
beforeAll(() => vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} }));
afterAll(() => vi.unstubAllGlobals());
afterEach(cleanup);
function setup(searchParams = "?v=T2M&r=US-WI&from=2002&to=2025&s=JJA") {
  const updates: UrlUpdateEvent[] = [];
  render(<CasePanel />, { wrapper: withNuqsTestingAdapter({ searchParams, onUrlUpdate: (event) => updates.push(event) }) });
  return updates;
}

describe("case controls", () => {
  it("loads catalogues and live analysis through the shared client", async () => {
    setup();
    const panel = screen.getByRole("region", { name: caseCopy.panel });
    expect(within(panel).getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Lead", "Scene", "Timeline"]);
    expect(api.POST).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: caseCopy.controls.calculate }));
    await screen.findByText("Wisconsin: Confirmed");
    const results = screen.getByRole("region", { name: caseCopy.results });
    expect(within(results).getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Results", "Evidence", "Verdict"]);
    const explain = screen.getByRole("region", { name: caseCopy.explainPane });
    expect(within(explain).getByText("Wisconsin")).toBeDefined();
    expect(within(explain).getByRole("heading", { level: 2, name: partnerCopy.title })).toBeDefined();
    expect(screen.queryByRole("group", { name: partnerCopy.readingLevel })).toBeNull();
    expect(screen.getByRole("combobox", { name: "Variable" }).getAttribute("value") ?? (screen.getByRole("combobox", { name: "Variable" }) as HTMLSelectElement).value).toBe("T2M");
    expect(screen.getByRole("figure", { name: caseCopy.controls.chart })).toBeDefined();
    expect(api.POST).toHaveBeenCalledWith("/api/py/analyze", expect.objectContaining({ body: { variable: "T2M", regions: ["US-WI"], start: 2002, end: 2025, season: "JJA", months: null } }));
    expect(screen.queryByText(/illustrative test data/)).toBeNull();
  });

  it("clamps the period when switching variable and leaves live provider availability to calculation", async () => {
    const updates = setup("?r=US-WI&from=1981&to=2025");
    const select = await screen.findByRole("combobox", { name: "Variable" });
    fireEvent.change(select, { target: { value: "MODIS_AQUA_AOD" } });
    await waitFor(() => expect(updates.at(-1)?.searchParams.get("from")).toBe("2002"));
    expect(updates.at(-1)?.searchParams.get("v")).toBe("MODIS_AQUA_AOD");
    cleanup();
    setup("?r=ESP");
    await screen.findByRole("combobox", { name: "Variable" });
    expect((screen.getByRole("option", { name: /Aerosol optical depth/ }) as HTMLOptionElement).disabled).toBe(false);
  });

  it("uses scientist definitions and supports removing the final region", async () => {
    const updates = setup("?r=US-WI&lvl=scientist");
    await screen.findByText("Monthly mean 2 m air temperature.");
    fireEvent.click(screen.getByRole("button", { name: "Remove region: Wisconsin" }));
    await screen.findByText(caseCopy.steps.scene.empty);
    expect(screen.queryByText("Wisconsin: Confirmed")).toBeNull();
    await waitFor(() => expect(updates.at(-1)?.searchParams.has("r")).toBe(false));
  });

  it("writes contiguous custom months across December and clears them for standard seasons", async () => {
    const updates = setup();
    await screen.findByRole("combobox", { name: "Variable" });
    fireEvent.click(screen.getByRole("radio", { name: "Custom" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Start month" }), { target: { value: "11" } });
    fireEvent.change(screen.getByRole("combobox", { name: "End month" }), { target: { value: "2" } });
    await waitFor(() => expect(updates.at(-1)?.searchParams.get("m")).toBe("11,12,1,2"));
    fireEvent.click(screen.getByRole("radio", { name: "Dec–Feb" }));
    await waitFor(() => expect(updates.at(-1)?.searchParams.get("s")).toBe("DJF"));
    expect(updates.at(-1)?.searchParams.has("m")).toBe(false);
  });

  it("keeps the explain-and-ask pane open and shows evidence and verdict only after Investigate", async () => {
    setup();
    await screen.findByRole("button", { name: "Investigate" });
    const explain = screen.getByRole("region", { name: caseCopy.explainPane });
    expect(within(explain).getByText(caseCopy.explainEmpty)).toBeDefined();
    expect(within(explain).getByText(partnerCopy.chatIntro)).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Evidence" })).toBeNull();
    await waitFor(() => expect((screen.getByRole("button", { name: "Investigate" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Investigate" }));
    await screen.findByText("Wisconsin: Confirmed");
    expect(screen.getByRole("heading", { name: "Evidence" })).toBeDefined();
    expect(within(explain).queryByText(caseCopy.explainEmpty)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: caseCopy.hideResults }));
    expect(screen.queryByRole("region", { name: caseCopy.results })).toBeNull();
    expect(screen.getByRole("region", { name: caseCopy.explainPane })).toBeDefined();
  });

  it("hides stale content while loading or in error and supports retry", () => {
    const retry = vi.fn();
    const { rerender } = render(<EvidenceStep loading><p>Old evidence</p></EvidenceStep>);
    expect(screen.getByRole("status").textContent).toBe(caseCopy.loading);
    expect(screen.queryByText("Old evidence")).toBeNull();
    rerender(<EvidenceStep error onRetry={retry}><p>Old evidence</p></EvidenceStep>);
    fireEvent.click(screen.getByRole("button", { name: caseCopy.retry }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.queryByText("Old evidence")).toBeNull();
  });
});

it("streams one explanation in the explain pane and none in the results pane", async () => {
  const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response('data: {"type":"text","text":"Checked explanation."}\n\ndata: {"type":"done"}\n\n', { headers: { "content-type": "text/event-stream" } }));
  try {
    setup();
    await waitFor(() => expect((screen.getByRole("button", { name: "Investigate" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Investigate" }));
    await waitFor(() => expect(screen.getAllByText("Checked explanation.")).toHaveLength(1));
    expect(fetcher).toHaveBeenCalledTimes(1);
    const results = screen.getByRole("region", { name: caseCopy.results });
    expect(within(results).queryByRole("region", { name: partnerCopy.explain })).toBeNull();
  } finally { fetcher.mockRestore(); }
});
