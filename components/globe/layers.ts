// Which region polygons the globe draws, and with which pen. Pure, so it is tested
// without WebGL. polygonsData must stay referentially stable per layer key, or
// react-globe.gl re-triangulates every polygon on each render.

export type RegionType = "country" | "state" | "ocean" | "named";

export interface RegionFeature {
  type: "Feature";
  properties: { id: string; name: string; type: RegionType };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
}

export interface GeoLayers {
  countries: RegionFeature[];
  states: RegionFeature[];
  oceans: RegionFeature[];
  named: RegionFeature[];
}

/** Below this camera altitude (globe radii) US states replace the USA outline. */
export const ZOOM_STATES_ALTITUDE = 1.4;

/** Named regions whose outline would cover the whole planet; selectable, never drawn. */
const WHOLE_EARTH = new Set(["NR-GLOBE", "NR-LAND", "NR-OCEAN"]);

const cache = new WeakMap<GeoLayers, Map<string, RegionFeature[]>>();

export function visibleFeatures(
  geo: GeoLayers,
  altitude: number,
  selected: readonly string[] = [],
): RegionFeature[] {
  const zoomedIn = altitude < ZOOM_STATES_ALTITUDE;
  const showStates = zoomedIn && !selected.includes("USA");
  const named = selected.filter((id) => id.startsWith("NR-") && !WHOLE_EARTH.has(id)).sort();
  const key = `${showStates ? "states" : "countries"}|${named.join(",")}`;

  let byKey = cache.get(geo);
  if (!byKey) {
    byKey = new Map();
    cache.set(geo, byKey);
  }
  const hit = byKey.get(key);
  if (hit) return hit;

  const namedSet = new Set(named);
  const features = [
    ...geo.oceans,
    ...(showStates ? geo.countries.filter((c) => c.properties.id !== "USA") : geo.countries),
    ...(showStates ? geo.states : []),
    ...geo.named.filter((n) => namedSet.has(n.properties.id)),
  ];
  byKey.set(key, features);
  return features;
}

/** The pen (0-3) a region draws with: its position in the case, never its rank. */
export function penIndex(id: string, regions: readonly string[]): number | null {
  const i = regions.indexOf(id);
  return i === -1 ? null : i;
}

export function penColor(id: string, regions: readonly string[]): string | null {
  const i = penIndex(id, regions);
  return i === null ? null : `var(--series-${i + 1})`;
}
