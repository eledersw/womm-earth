// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CasePanel } from "./CasePanel";
import { EvidenceStep } from "./steps/EvidenceStep";
import { caseCopy } from "@/lib/copy/case";
import { partnerCopy } from "@/lib/copy/partner";
import fixture from "@/api/_fixtures/analyze.json";

afterEach(cleanup);

describe("case panel shell", () => {
  it("feeds all five sections from the official fixture and labels its values as illustrative", () => {
    render(<CasePanel />);
    const panel = screen.getByRole("region", { name: caseCopy.panel });
    expect(within(panel).getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent))
      .toEqual(["Lead", "Scene", "Timeline", "Evidence", "Verdict"]);
    expect(screen.getByRole("tab", { name: "Case" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText(caseCopy.fixture.disclaimer)).toBeDefined();
    expect(screen.getByText(`Wisconsin (${fixture.results[0].region.id})`)).toBeDefined();
    expect(screen.getByText(`${fixture.case.start}–${fixture.case.end} · ${fixture.case.season}`)).toBeDefined();
    expect(screen.getByRole("figure", { name: caseCopy.fixture.chart })).toBeDefined();
    expect(screen.getByText(`${fixture.results[0].region.name}: ${caseCopy.tiers.confirmed}`)).toBeDefined();
    expect(screen.getByText(caseCopy.fixture.verdict)).toBeDefined();
  });

  it("switches to the Partner with keyboard and returns to the Case", async () => {
    render(<CasePanel />);
    const caseTab = screen.getByRole("tab", { name: "Case" });
    caseTab.focus();
    fireEvent.keyDown(caseTab, { key: "ArrowRight" });
    const partnerTab = screen.getByRole("tab", { name: "Partner" });
    await waitFor(() => expect(document.activeElement).toBe(partnerTab));
    fireEvent.keyDown(partnerTab, { key: "Enter" });
    expect(screen.getByText(partnerCopy.offline)).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Evidence" })).toBeNull();
    fireEvent.keyDown(partnerTab, { key: "ArrowLeft" });
    await waitFor(() => expect(document.activeElement).toBe(caseTab));
    fireEvent.keyDown(caseTab, { key: "Enter" });
    expect(screen.getByRole("heading", { name: "Evidence" })).toBeDefined();
  });

  it("hides stale content while loading or in error and supports retry", () => {
    const retry = vi.fn();
    const { rerender } = render(<EvidenceStep loading><p>Old evidence</p></EvidenceStep>);
    expect(screen.getByRole("status").textContent).toBe(caseCopy.loading);
    expect(screen.queryByText("Old evidence")).toBeNull();
    rerender(<EvidenceStep error onRetry={retry}><p>Old evidence</p></EvidenceStep>);
    expect(screen.getByRole("alert").textContent).toContain(caseCopy.error);
    expect(screen.queryByText("Old evidence")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: caseCopy.retry }));
    expect(retry).toHaveBeenCalledOnce();
    rerender(<EvidenceStep><p>Current evidence</p></EvidenceStep>);
    expect(screen.getByText("Current evidence")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
