"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api/client";
import type { Region } from "@/lib/api/types";

// All selectable regions (names, types, centroids) from /api/py/regions, fetched once.
let cached: Promise<Region[]> | null = null;

function loadRegions(): Promise<Region[]> {
  if (!cached) {
    const request: Promise<Region[]> = api.GET("/api/py/regions").then(({ data, error }) => {
      if (error || !data) throw new Error("regions unavailable");
      return data as Region[];
    });
    cached = request.catch((e: unknown) => {
      cached = null; // allow a retry on the next mount
      throw e;
    });
  }
  return cached;
}

export function useRegionIndex(): { regions: Region[]; byId: Map<string, Region>; ready: boolean } {
  const [regions, setRegions] = useState<Region[]>([]);
  useEffect(() => {
    let live = true;
    loadRegions()
      .then((r) => {
        if (live) setRegions(r);
      })
      .catch(() => {
        if (live) setRegions([]);
      });
    return () => {
      live = false;
    };
  }, []);
  const byId = useMemo(() => new Map(regions.map((r) => [r.id, r])), [regions]);
  return { regions, byId, ready: regions.length > 0 };
}
