"use client";

import { globeCopy } from "@/lib/copy/globe";
import { Globe } from "./Globe";
import { GlobeHud } from "./GlobeHud";
import { Legend } from "./Legend";
import { RegionSearch } from "./RegionSearch";
import { TRENDMAP_LIVE } from "./useTrendMap";

// The globe floats in space; its controls float on glass around it. From 900px
// the globe area runs under both panes, so its controls sit in the open space
// between them: search and the trend legend along the top, the read-out at the
// bottom left.
export function GlobeArea() {
  return (
    <div className="relative h-full">
      <Globe />
      <div className="absolute top-3 left-3 min-[900px]:top-(--header-height) min-[900px]:left-[calc(var(--panel-width)*0.5+2rem)]">
        <RegionSearch />
      </div>
      <div className="absolute top-3 right-3 min-[900px]:top-(--header-height) min-[900px]:right-[calc(var(--results-width)*0.5+2rem)]">
        {TRENDMAP_LIVE ? <Legend /> : null}
      </div>
      <div className="absolute bottom-3 left-3 flex flex-col items-start gap-2 min-[900px]:bottom-5 min-[900px]:left-[calc(var(--panel-width)*0.5+2rem)]">
        <p className="hidden text-sm text-ink-2 sm:block">{globeCopy.hint}</p>
        <GlobeHud />
      </div>
    </div>
  );
}
