"use client";
import { Button } from "@/components/ui/button";
import type { Region } from "@/lib/api/types";
import { MAX_REGIONS } from "@/lib/state/case-codec";
import { caseCopy } from "@/lib/copy/case";
import type { CaseControls } from "../controls";
import { StepSection, type StepProps } from "./StepSection";

export function SceneStep({ state, setCase, regions, ...status }: StepProps & CaseControls & { regions: Record<string, Region> }) {
  return <StepSection step="scene" {...status}>
    {state.regions.length ? <ul className="flex flex-wrap gap-2">
      {state.regions.map((id) => <li key={id} className="rounded-md border p-2 text-sm">
        <span>{regions[id]?.name ?? id} ({id})</span>
        <Button variant="ghost" size="sm" aria-label={`${caseCopy.controls.removeRegion}: ${regions[id]?.name ?? id}`}
          onClick={() => setCase({ regions: state.regions.filter((item) => item !== id) })}>×</Button>
        {regions[id]?.nearest_cell_fallback && <p className="mt-1 text-muted-foreground">{caseCopy.controls.nearestCellFallback}</p>}
      </li>)}
    </ul> : <p className="text-sm text-muted-foreground">{caseCopy.steps.scene.empty}</p>}
    <p className="mt-2 text-sm text-muted-foreground">{state.regions.length}/{MAX_REGIONS} · {caseCopy.controls.addOnGlobe}</p>
  </StepSection>;
}
