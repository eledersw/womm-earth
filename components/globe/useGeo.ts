"use client";

import { useEffect, useState } from "react";
import type { GeoLayers, RegionFeature } from "./layers";

// Region geometry from the pipeline (public/geo, owned by Oier), fetched once per page.
const FILES = {
  countries: "/geo/countries.geojson",
  states: "/geo/us-states.geojson",
  subregions: "/geo/admin1.geojson",
  oceans: "/geo/oceans.geojson",
  named: "/geo/named.geojson",
} as const;

let cached: Promise<GeoLayers> | null = null;

async function fetchLayer(url: string): Promise<RegionFeature[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const fc = (await res.json()) as { features: RegionFeature[] };
  return fc.features;
}

function loadGeo(): Promise<GeoLayers> {
  cached ??= Promise.all([
    fetchLayer(FILES.countries),
    fetchLayer(FILES.states),
    fetchLayer(FILES.subregions),
    fetchLayer(FILES.oceans),
    fetchLayer(FILES.named),
  ])
    .then(([countries, states, subregions, oceans, named]) => ({ countries, states, subregions, oceans, named }))
    .catch((e) => {
      cached = null;
      throw e;
    });
  return cached;
}

export function useGeo(): { geo: GeoLayers | null; failed: boolean } {
  const [geo, setGeo] = useState<GeoLayers | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    loadGeo()
      .then((g) => live && setGeo(g))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);
  return { geo, failed };
}
