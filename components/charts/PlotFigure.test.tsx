// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Plot from "@observablehq/plot";
import { PlotFigure } from "./PlotFigure";

vi.mock("@observablehq/plot", () => ({
  plot: vi.fn(() => document.createElementNS("http://www.w3.org/2000/svg", "svg")),
}));

const observers: ResizeObserverMock[] = [];
class ResizeObserverMock {
  target?: Element;
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor(private callback: ResizeObserverCallback) { observers.push(this); }
  observe = (target: Element) => { this.target = target; };
  resize(width: number) {
    this.callback([{ target: this.target, contentRect: { width } } as ResizeObserverEntry], this);
  }
}

const options = (width: number): Plot.PlotOptions => ({ width, marks: [] });

beforeEach(() => {
  observers.length = 0;
  vi.clearAllMocks();
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 640, height: 300, top: 0, left: 0, right: 640, bottom: 300,
    x: 0, y: 0, toJSON: () => ({}),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("style");
  document.documentElement.removeAttribute("class");
});

describe("PlotFigure lifecycle", () => {
  it("replaces the figure on resize and cleans up on unmount", () => {
    const { container, unmount } = render(<PlotFigure options={options} label="Yearly series" caption="Source: NASA" />);
    const first = container.querySelector("svg");
    expect(first).not.toBeNull();
    expect(screen.getByRole("figure", { name: "Yearly series" })).toBeDefined();
    expect(screen.getByText("Source: NASA")).toBeDefined();
    expect(Plot.plot).toHaveBeenLastCalledWith(expect.objectContaining({ width: 640 }));

    act(() => observers[0].resize(420.8));
    expect(first?.isConnected).toBe(false);
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(Plot.plot).toHaveBeenLastCalledWith(expect.objectContaining({ width: 420 }));
    act(() => observers[0].resize(420.1));
    expect(Plot.plot).toHaveBeenCalledTimes(2);

    const last = container.querySelector("svg");
    unmount();
    expect(last?.isConnected).toBe(false);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    act(() => observers[0].resize(800));
    expect(Plot.plot).toHaveBeenCalledTimes(2);
  });

  it("rebuilds with new options and leaves a single figure in StrictMode", () => {
    const { container, rerender } = render(<StrictMode><PlotFigure options={options} /></StrictMode>);
    const first = container.querySelector("svg");
    const next = vi.fn(options);
    rerender(<StrictMode><PlotFigure options={next} /></StrictMode>);
    expect(first?.isConnected).toBe(false);
    expect(next).toHaveBeenCalledWith(640);
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("waits for positive width and removes a plot when its container is hidden", () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({ width: 0 } as DOMRect);
    const { container } = render(<PlotFigure options={options} />);
    expect(Plot.plot).not.toHaveBeenCalled();
    act(() => observers[0].resize(300));
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    act(() => observers[0].resize(0));
    expect(container.querySelectorAll("svg")).toHaveLength(0);
    act(() => observers[0].resize(300));
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("reads series colors from CSS and redraws after a theme change", async () => {
    document.documentElement.style.setProperty("--series-1", "rebeccapurple");
    document.documentElement.style.setProperty("--foreground", "black");
    const { container } = render(<PlotFigure options={options} />);
    expect(Plot.plot).toHaveBeenLastCalledWith(expect.objectContaining({
      color: { range: ["rebeccapurple", "currentColor", "currentColor", "currentColor"] },
    }));
    await act(async () => {
      document.documentElement.style.setProperty("--series-1", "orange");
    });
    expect(Plot.plot).toHaveBeenLastCalledWith(expect.objectContaining({
      color: { range: ["orange", "currentColor", "currentColor", "currentColor"] },
    }));
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("falls back to window resizing when ResizeObserver is unavailable", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const { container, unmount } = render(<PlotFigure options={options} />);
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({ width: 500 } as DOMRect);
    act(() => window.dispatchEvent(new Event("resize")));
    expect(Plot.plot).toHaveBeenLastCalledWith(expect.objectContaining({ width: 500 }));
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    unmount();
    act(() => window.dispatchEvent(new Event("resize")));
    expect(Plot.plot).toHaveBeenCalledTimes(2);
  });
});
