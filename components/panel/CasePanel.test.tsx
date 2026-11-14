// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CasePanel } from "./CasePanel";
import { EvidenceStep } from "./steps/EvidenceStep";
import { caseCopy } from "@/lib/copy/case";
import { partnerCopy } from "@/lib/copy/partner";

afterEach(cleanup);

describe("case panel shell", () => {
  it("shows the five steps in order, without a fabricated verdict", () => {
    render(<CasePanel />);
    const panel = screen.getByRole("region", { name: caseCopy.panel });
    expect(within(panel).getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent))
      .toEqual(["Lead", "Scene", "Timeline", "Evidence", "Verdict"]);
    expect(screen.getByRole("tab", { name: "Case" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText(caseCopy.steps.verdict.empty)).toBeDefined();
    expect(screen.queryByText(caseCopy.tiers.confirmed)).toBeNull();
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
