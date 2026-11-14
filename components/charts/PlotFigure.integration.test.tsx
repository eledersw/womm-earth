// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import * as Plot from "@observablehq/plot";
import { afterEach, expect, it, vi } from "vitest";
import { PlotFigure } from "./PlotFigure";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("mounts and updates an actual Observable Plot SVG", () => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 640 } as DOMRect);
  // Synthetic coordinates for wrapper integration only, never displayed as NASA data.
  const data = [{ year: 2000, value: 1 }, { year: 2001, value: 2 }];
  const { container, rerender, unmount } = render(
    <PlotFigure options={() => ({
      ariaLabel: "Test yearly values",
      x: { label: "Year" }, y: { label: "Test units" },
      marks: [Plot.dot(data, { x: "year", y: "value" })],
    })} />,
  );
  expect(container.querySelectorAll("svg")).toHaveLength(1);
  expect(container.querySelectorAll("circle")).toHaveLength(2);
  expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe("Test yearly values");
  const original = container.querySelector("svg");
  rerender(<PlotFigure options={() => ({ marks: [] })} />);
  expect(original?.isConnected).toBe(false);
  expect(container.querySelectorAll("svg")).toHaveLength(1);
  const last = container.querySelector("svg");
  unmount();
  expect(last?.isConnected).toBe(false);
});
