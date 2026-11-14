"use client";

import { globeCopy } from "@/lib/copy/globe";
import { Globe } from "./Globe";
import { RegionSearch } from "./RegionSearch";

// The viewing window: the globe fills it; the window's own controls sit on the glass.
export function GlobeArea() {
  return (
    <div className="relative h-full">
      <Globe />
      <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-4">
        <div className="pointer-events-auto">
          <RegionSearch />
        </div>
        <p className="scale-label text-window-ink-2">{globeCopy.windowLabel}</p>
      </div>
    </div>
  );
}
