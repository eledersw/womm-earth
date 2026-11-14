"use client";

import { useSyncExternalStore } from "react";
import { globeCopy } from "@/lib/copy/globe";
import { MAX_REGIONS } from "@/lib/state/case-codec";
import { useCase } from "@/lib/state/use-case";
import { formatDegrees, povStore } from "./povStore";

// Where the camera is looking and how many regions are in the case, set in
// Fragment's thin figures over small mono labels.
export function GlobeHud() {
  const pov = useSyncExternalStore(povStore.subscribe, povStore.get, povStore.get);
  const { state } = useCase();
  const lat = formatDegrees(pov.lat, "lat");
  const lng = formatDegrees(pov.lng, "lng");

  return (
    <dl
      aria-label={globeCopy.hudLabel}
      className="glass-pill flex items-end gap-6 rounded-2xl px-5 py-3.5"
    >
      <Readout label={globeCopy.hudLat} value={lat.value} unit={`° ${lat.hemi}`} />
      <Readout label={globeCopy.hudLng} value={lng.value} unit={`° ${lng.hemi}`} />
      <span aria-hidden className="mb-1 h-8 w-px bg-hairline-strong" />
      <Readout label={globeCopy.hudRegions} value={String(state.regions.length)} unit={`/ ${MAX_REGIONS}`} />
    </dl>
  );
}

function Readout({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="label-mono">{label}</dt>
      <dd className="m-0 flex items-baseline gap-1">
        <span className="figure min-w-[2.6ch] text-right text-[2rem]">{value}</span>
        <span className="font-mono text-xs text-ink-3">{unit}</span>
      </dd>
    </div>
  );
}
