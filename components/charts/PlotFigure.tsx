"use client";

import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";

export interface PlotFigureProps {
  options: (width: number) => Plot.PlotOptions;
  className?: string;
  label?: string;
  caption?: string;
}

export function PlotFigure({ options, className, label, caption }: PlotFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let figure: ReturnType<typeof Plot.plot> | undefined;
    let lastWidth = -1;
    let disposed = false;

    const draw = (width: number, force = false) => {
      if (disposed || !Number.isFinite(width)) return;
      const nextWidth = Math.max(0, Math.floor(width));
      if (!force && nextWidth === lastWidth) return;
      lastWidth = nextWidth;
      figure?.remove();
      figure = undefined;
      if (nextWidth === 0) return;

      const tokens = getComputedStyle(container);
      const range = [1, 2, 3, 4].map((index) =>
        // The scaffold's chart tokens cover the interval before tokens.css lands.
        tokens.getPropertyValue(`--series-${index}`).trim() ||
        tokens.getPropertyValue(`--chart-${index}`).trim() || "currentColor",
      );
      const config = options(nextWidth);
      figure = Plot.plot({
        ...config,
        width: nextWidth,
        color: { range, ...config.color },
        style: config.style ?? {
          background: "transparent",
          color: tokens.getPropertyValue("--foreground").trim() || "currentColor",
          fontFamily: "inherit",
        },
      });
      container.append(figure);
    };

    const measure = () => draw(container.getBoundingClientRect().width);
    measure();

    const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) draw(entry.contentRect.width);
      }
    });
    resize?.observe(container);
    if (!resize) window.addEventListener("resize", measure);

    const redrawTheme = () => draw(container.getBoundingClientRect().width, true);
    const theme = new MutationObserver(redrawTheme);
    for (const element of [document.documentElement, document.body]) {
      theme.observe(element, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    }
    const colorScheme = window.matchMedia?.("(prefers-color-scheme: dark)");
    colorScheme?.addEventListener("change", redrawTheme);

    return () => {
      disposed = true;
      resize?.disconnect();
      window.removeEventListener("resize", measure);
      theme.disconnect();
      colorScheme?.removeEventListener("change", redrawTheme);
      figure?.remove();
    };
  }, [options]);

  return (
    <figure aria-label={label} className={className}>
      <div ref={containerRef} className="min-w-0 overflow-x-auto" />
      {caption ? <figcaption className="mt-2 text-sm text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
}
