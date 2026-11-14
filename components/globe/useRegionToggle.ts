"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { globeCopy } from "@/lib/copy/globe";
import { MAX_REGIONS } from "@/lib/state/case-codec";
import { useCase } from "@/lib/state/use-case";

// Shared by globe clicks and the search box: add a region (as the next pen) or
// remove it; a fifth pen is refused with a toast.
export function useRegionToggle() {
  const { state, setCase } = useCase();
  return useCallback(
    (id: string, opts: { onlyAdd?: boolean } = {}) => {
      if (state.regions.includes(id)) {
        if (!opts.onlyAdd) setCase({ regions: state.regions.filter((r) => r !== id) });
        return;
      }
      if (state.regions.length >= MAX_REGIONS) {
        toast(globeCopy.maxRegions);
        return;
      }
      setCase({ regions: [...state.regions, id] });
    },
    [state.regions, setCase],
  );
}
