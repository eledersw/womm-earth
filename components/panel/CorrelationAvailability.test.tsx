// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CorrelationView } from "./CorrelationView";
import { DEFAULT_CASE } from "@/lib/state/case-codec";
import { caseCopy } from "@/lib/copy/case";
import { api } from "@/lib/api/client";
vi.mock("@/lib/api/client", () => ({ api: { POST: vi.fn() } }));
afterEach(cleanup);
it("does not expose demonstration correlations or request statistics from the stub endpoint", async () => {
  render(<CorrelationView state={{ ...DEFAULT_CASE, regions: ["US-WI"] }} variables={[]} />);
  expect(screen.getByText(caseCopy.explorations.correlationUnavailable)).toBeDefined();
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(screen.queryByText("Raw Pearson r")).toBeNull();
  await Promise.resolve();
  expect(api.POST).not.toHaveBeenCalled();
});
