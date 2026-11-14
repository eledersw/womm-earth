// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { withNuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { afterEach, expect, it, vi } from "vitest";
import { useUiStore } from "@/lib/state/ui-store";
import type { Region } from "@/lib/api/types";
import type { Tour } from "@/lib/tour/types";
import { TourPlayer } from "./TourPlayer";
import { TourLauncher } from "./TourLauncher";
const query = "v=T2M&r=US-WI&from=2002&to=2025&s=JJA&lvl=student";
const tour: Tour = { id: "fixture-guide", title: "Test guide", steps: [
  { query, caption: "First step", highlight: ["US-WI"], reveal: false },
  { query: "v=PRECTOTCORR&r=ESP&from=2002&to=2025&s=ANN&lvl=student", caption: "Second step", reveal: true },
] };
const regions = { "US-WI": { id: "US-WI", centroid: [-89.6, 44.5] }, ESP: { id: "ESP", centroid: [-3.5, 40.2] } } as unknown as Record<string, Region>;
afterEach(() => { cleanup(); vi.useRealTimers(); useUiStore.setState({ highlight: { kind: null, regions: [], arcFrom: null }, focus: null, predictMode: false, reveal: true }); });
it("applies step URL, canonical centroid coordinates, highlight and reveal, then restores the original Case on Exit and UI state on unmount", async () => {
  const updates: UrlUpdateEvent[] = [];
  const { unmount } = render(<TourPlayer tour={tour} regions={regions} onExit={() => {}} />, { wrapper: withNuqsTestingAdapter({ searchParams: "?r=USA", onUrlUpdate: (e) => updates.push(e) }) });
  await waitFor(() => expect(updates.at(-1)?.searchParams.get("r")).toBe("US-WI"));
  expect(useUiStore.getState().focus).toEqual({ lat: 44.5, lng: -89.6, altitude: 1.5 });
  expect(useUiStore.getState().highlight).toEqual({ kind: "tour", regions: ["US-WI"], arcFrom: null });
  expect(useUiStore.getState().reveal).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => expect(updates.at(-1)?.searchParams.get("r")).toBe("ESP"));
  expect(screen.getByText("Second step")).toBeDefined();
  expect(useUiStore.getState().reveal).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Exit guide" }));
  unmount();
  expect(useUiStore.getState().highlight.kind).toBeNull();
  expect(useUiStore.getState().focus).toBeNull();
  await waitFor(() => expect(updates.at(-1)?.searchParams.get("r")).toBe("USA"));
});
it("autoplay advances after 6 seconds and stops at the last step", async () => {
  vi.useFakeTimers();
  render(<TourPlayer tour={tour} regions={regions} onExit={() => {}} />, { wrapper: withNuqsTestingAdapter({ searchParams: `?${query}`, hasMemory: true }) });
  fireEvent.click(screen.getByRole("button", { name: "Play" }));
  await act(async () => { vi.advanceTimersByTime(5999); });
  expect(screen.getByText("First step")).toBeDefined();
  await act(async () => { vi.advanceTimersByTime(1); });
  expect(screen.getByText("Second step")).toBeDefined();
  expect(screen.getByRole("button", { name: "Play again" })).toBeDefined();
  await act(async () => { vi.advanceTimersByTime(12_000); });
  expect(screen.getByText("Second step")).toBeDefined();
});
it("launcher shows a safe fallback and can guide the current Case without demo claims", async () => {
  render(<TourLauncher regions={regions} />, { wrapper: withNuqsTestingAdapter({ searchParams: `?${query}`, hasMemory: true }) });
  expect(screen.getByText(/Guided demonstration cases are being prepared/)).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Guide me through this Case" }));
  expect(screen.getByText("Your Case, step by step")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Exit guide" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Guide me through this Case" })).toBeDefined());
});
it("uses explicit focus and pauses autoplay after manual Case edits", async () => {
  vi.useFakeTimers();
  const { useCase } = await import("@/lib/state/use-case");
  function Harness() {
    const { setCase } = useCase();
    return <><button onClick={() => setCase({ variable: "GWETROOT" })}>Edit Case</button><TourPlayer tour={{ ...tour, steps: [{ ...tour.steps[0], focus: { lat: 10, lng: 20, altitude: 2 } }, tour.steps[1]] }} regions={regions} onExit={() => {}} /></>;
  }
  render(<Harness />, { wrapper: withNuqsTestingAdapter({ searchParams: `?${query}`, hasMemory: true }) });
  expect(useUiStore.getState().focus).toEqual({ lat: 10, lng: 20, altitude: 2 });
  fireEvent.click(screen.getByRole("button", { name: "Play" }));
  fireEvent.click(screen.getByRole("button", { name: "Edit Case" }));
  await act(async () => { vi.advanceTimersByTime(6000); });
  expect(screen.getByText("First step")).toBeDefined();
  expect(screen.getByRole("button", { name: "Play" })).toBeDefined();
});
it("launches a supplied approved tour from its Watch this case button", () => {
  render(<TourLauncher regions={regions} availableTours={[tour]} />, { wrapper: withNuqsTestingAdapter({ searchParams: `?${query}`, hasMemory: true }) });
  fireEvent.click(screen.getByRole("button", { name: "Watch this case: Test guide" }));
  expect(screen.getByText("First step")).toBeDefined();
});
