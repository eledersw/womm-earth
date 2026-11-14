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
  { type: "state", heading: globeCopy.groupState },
  { type: "ocean", heading: globeCopy.groupOcean },
  { type: "named", heading: globeCopy.groupNamed },
];

// Keyboard and small-region path to the globe: find a place, add it as the next
// pen, and fly the globe to it.
export function RegionSearch() {
  const [open, setOpen] = useState(false);
  const { regions, ready } = useRegionIndex();
  const { state } = useCase();
  const toggleRegion = useRegionToggle();
  const flyTo = useUiStore((s) => s.flyTo);

  function choose(r: Region) {
    toggleRegion(r.id, { onlyAdd: true });
    if (r.id !== "NR-GLOBE") flyTo({ ...regionLatLng(r), altitude: r.type === "state" ? 0.9 : 1.6 });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="scale-label inline-flex h-10 items-center gap-2 rounded-sm border border-paper-leaf/20 bg-window-2/90 px-3 text-window-ink shadow-[0_2px_6px_rgb(0_0_0/0.4)] backdrop-blur-[2px] hover:border-paper-leaf/40 focus-visible:outline-signal-lamp"
        >
          <Search aria-hidden className="size-4" strokeWidth={2} />
          {globeCopy.searchTrigger}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <Command
          filter={(value, search) =>
            value.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder={globeCopy.searchPlaceholder} />
          <CommandList className="max-h-[min(22rem,50dvh)]">
            <CommandEmpty>{ready ? globeCopy.searchEmpty : globeCopy.searchUnavailable}</CommandEmpty>
            {GROUPS.map(({ type, heading }) => {
              const items = regions.filter((r) => r.type === type);
              if (!items.length) return null;
              return (
                <CommandGroup key={type} heading={heading}>
                  {items.map((r) => {
                    const pen = penColor(r.id, state.regions);
                    return (
                      <CommandItem key={r.id} value={`${r.name} ${r.id}`} onSelect={() => choose(r)}>
                        <span className="flex-1">{r.name}</span>
                        {pen ? (
                          <span className="scale-label flex items-center gap-1.5 text-ink-3">
                            <span aria-hidden className="size-2.5 rounded-full" style={{ background: pen }} />
                            {globeCopy.selectedPen}
                          </span>
                        ) : (
                          <span className="font-mono text-sm text-ink-3">{r.id}</span>
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
