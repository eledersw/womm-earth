"use client";

import { globeCopy } from "@/lib/copy/globe";
import { Globe } from "./Globe";
import { GlobeHud } from "./GlobeHud";
import { RegionSearch } from "./RegionSearch";

// The globe floats in space; its controls float on glass around it. From 900px
// the globe area starts under the case panel, so its controls sit just right of
// the panel: search at the top, the read-out at the bottom (the results pane
// opens on the right after Investigate).
export function GlobeArea() {
  return (
    <div className="relative h-full">
      <Globe />
      <div className="absolute top-4 left-4 min-[900px]:top-(--header-height) min-[900px]:left-[calc(var(--panel-width)*0.5+2.5rem)]">
        <RegionSearch />
      </div>
      <div className="absolute bottom-4 left-4 flex flex-col items-start gap-3 min-[900px]:bottom-6 min-[900px]:left-[calc(var(--panel-width)*0.5+2.5rem)]">
        <p className="label-mono hidden sm:block">{globeCopy.hint}</p>
        <GlobeHud />
      </div>
    </div>
  );
}
