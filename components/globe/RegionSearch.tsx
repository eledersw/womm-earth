"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { regionLatLng } from "@/lib/api/region-geo";
import type { Region } from "@/lib/api/types";
import { globeCopy } from "@/lib/copy/globe";
import { useCase } from "@/lib/state/use-case";
import { useUiStore } from "@/lib/state/ui-store";
import { penColor } from "./layers";
import { useRegionIndex } from "./useRegionIndex";
import { useRegionToggle } from "./useRegionToggle";

const GROUPS: { type: Region["type"]; heading: string }[] = [
  { type: "country", heading: globeCopy.groupCountry },
  { type: "subregion", heading: globeCopy.groupSubregion },
  { type: "named", heading: globeCopy.groupNamed },
];

// Keyboard and small-region path to the globe: find a place, add it as the next
// pen, and fly the globe to it.
export function RegionSearch() {
  const [open, setOpen] = useState(false);
  const { regions, ready } = useRegionIndex();
  const dividedParents = new Set(regions.filter((r) => r.type === "subregion").map((r) => r.parent));
  const { state } = useCase();
  const toggleRegion = useRegionToggle();
  const flyTo = useUiStore((s) => s.flyTo);

  function choose(r: Region) {
    toggleRegion(r.id, { onlyAdd: true });
    if (r.id !== "NR-GLOBE") flyTo({ ...regionLatLng(r), altitude: r.type === "subregion" ? 0.9 : 1.6 });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="label-nav glass-pill inline-flex h-9 items-center gap-2 rounded-full pr-4 pl-3 text-ink transition-colors duration-150 hover:bg-well-2"
        >
          <Search aria-hidden className="size-4" strokeWidth={1.75} />
          {globeCopy.searchTrigger}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={10} className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border-hairline-strong p-0 backdrop-blur-xl">
        <Command
          filter={(value, search) =>
            value.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder={globeCopy.searchPlaceholder} />
          <CommandList className="max-h-[min(22rem,50dvh)]">
            <CommandEmpty>{ready ? globeCopy.searchEmpty : globeCopy.searchUnavailable}</CommandEmpty>
            {GROUPS.map(({ type, heading }) => {
              const items = regions.filter((r) => r.type === type && r.id !== "NR-OCEAN" && !dividedParents.has(r.id));
              if (!items.length) return null;
              return (
                <CommandGroup key={type} heading={heading}>
                  {items.map((r) => {
                    const pen = penColor(r.id, state.regions);
                    return (
                      <CommandItem key={r.id} value={`${r.name} ${r.id}`} onSelect={() => choose(r)}>
                        <span className="flex-1">{r.name}</span>
                        {pen ? (
                          <span className="label-mono flex items-center gap-1.5">
                            <span aria-hidden className="size-2.5 rounded-full" style={{ background: pen }} />
                            {globeCopy.selectedPen}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-ink-3">{r.id}</span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
