"use client";

import { globeCopy } from "@/lib/copy/globe";
import { Globe } from "./Globe";
import { GlobeHud } from "./GlobeHud";
import { RegionSearch } from "./RegionSearch";

// The globe floats in space; its controls float on glass around it. From 900px
// the globe area starts under the case panel, so the search clears the panel.
export function GlobeArea() {
  return (
    <div className="relative h-full">
      <Globe />
      <div className="absolute top-4 left-4 min-[900px]:top-(--header-height) min-[900px]:left-[calc(var(--panel-width)*0.5+2.5rem)]">
        <RegionSearch />
      </div>
      <div className="absolute right-4 bottom-4 flex flex-col items-end gap-3 min-[900px]:right-6 min-[900px]:bottom-6">
        <p className="label-mono hidden text-ink-3 sm:block">{globeCopy.hint}</p>
        <GlobeHud />
      </div>
    </div>
  );
}
