"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { globeCopy } from "@/lib/copy/globe";
import { MAX_REGIONS } from "@/lib/state/case-codec";
import { useCase } from "@/lib/state/use-case";
import { useRegionIndex } from "./useRegionIndex";

// Shared by globe clicks and the search box: add a region (as the next pen) or
// remove it; a fifth pen is refused with a toast.
export function useRegionToggle() {
  const { state, setCase } = useCase();
  const { byId } = useRegionIndex();
  return useCallback(
    (id: string, opts: { onlyAdd?: boolean } = {}) => {
      if (state.regions.includes(id)) {
        if (!opts.onlyAdd) setCase({ regions: state.regions.filter((r) => r !== id) });
        return;
      }
      const selected = byId.get(id);
      let next = state.regions;
      if (selected?.type === "subregion" && selected.parent) {
        next = next.filter((region) => region !== selected.parent);
      } else if (selected?.type === "country") {
        next = next.filter((region) => byId.get(region)?.parent !== id);
      }
      if (next.length >= MAX_REGIONS) {
        toast(globeCopy.maxRegions);
        return;
      }
      setCase({ regions: [...next, id] });
    },
    [state.regions, setCase, byId],
  );
}
