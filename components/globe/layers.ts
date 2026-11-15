// Which region polygons the globe draws, and with which pen. Pure, so it is tested
// without WebGL. polygonsData must stay referentially stable per layer key, or
// react-globe.gl re-triangulates every polygon on each render.

export type RegionType = "country" | "state" | "subregion" | "ocean" | "named";

export interface RegionFeature {
  type: "Feature";
  properties: { id: string; name: string; type: RegionType; parent?: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
}

export interface GeoLayers {
  countries: RegionFeature[];
  states: RegionFeature[];
  subregions: RegionFeature[];
  named: RegionFeature[];
}

/** Below this camera altitude (globe radii) divided countries show their regions. */
export const ZOOM_STATES_ALTITUDE = 1.4;

/** Named regions whose outline would cover the whole planet; selectable, never drawn. */
const WHOLE_EARTH = new Set(["NR-GLOBE", "NR-LAND", "NR-OCEAN"]);

const cache = new WeakMap<GeoLayers, Map<string, RegionFeature[]>>();
const capCache = new WeakMap<RegionFeature, number | null>();

function allPoints(f: RegionFeature): number[][] {
  const coords = f.geometry.coordinates as number[][][] | number[][][][];
  const polys = (f.geometry.type === "Polygon" ? [coords] : coords) as number[][][][];
  return polys.flat(2) as unknown as number[][];
}

/**
 * Ocean or named regions that wrap all 360° of longitude and reach a pole (the
 * Southern Ocean, the Arctic). three-globe can't fill these: it paints the
 * complement, so the "cap" covers the whole planet and swallows every click.
 * Returns the cap's boundary latitude, or null for an ordinary region.
 */
export function polarCapLatitude(f: RegionFeature): number | null {
  if (capCache.has(f)) return capCache.get(f)!;
  let result: number | null = null;
  const t = f.properties.type;
  if (t !== "country" && t !== "state" && !WHOLE_EARTH.has(f.properties.id)) {
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lng, lat] of allPoints(f)) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    if (maxLng - minLng >= 359) {
      if (minLat <= -89.9 && maxLat < 89.9) result = maxLat;
      else if (maxLat >= 89.9 && minLat > -89.9) result = minLat;
    }
  }
  capCache.set(f, result);
  return result;
}

export interface CapRing {
  id: string;
  pen: number;
  /** [lat, lng] points along the cap's boundary latitude, -180..180 every 2° */
  points: [number, number][];
}

/** Selected polar caps, drawn as a latitude ring in their pen instead of a fill. */
export function capRings(geo: GeoLayers, regions: readonly string[]): CapRing[] {
  const rings: CapRing[] = [];
  for (const f of geo.named) {
    const pen = penIndex(f.properties.id, regions);
    if (pen === null) continue;
    const lat = polarCapLatitude(f);
    if (lat === null) continue;
    const points: [number, number][] = [];
    for (let lng = -180; lng <= 180; lng += 2) points.push([lat, lng]);
    rings.push({ id: f.properties.id, pen, points });
  }
  return rings;
}

/** The country a region belongs to (US states carry no parent in their GeoJSON). */
export function parentOf(props: RegionFeature["properties"]): string | undefined {
  return props.parent ?? (props.type === "state" ? "USA" : undefined);
}

/**
 * Zoomed out you pick whole countries. Zoomed in, divided countries (the USA,
 * Brazil, Russia...) show their regions instead, so a click picks a region; a
 * selected divided country keeps its fill with its regions outlined on top.
 * Selected regions always draw. Oceans are not selectable.
 */
export function visibleFeatures(
  geo: GeoLayers,
  altitude: number,
  selected: readonly string[] = [],
): RegionFeature[] {
  const zoomedIn = altitude < ZOOM_STATES_ALTITUDE;
  const named = selected.filter((id) => id.startsWith("NR-") && !WHOLE_EARTH.has(id)).sort();
  const picked = zoomedIn ? [] : selected.filter((id) => id.startsWith("US-") || id.startsWith("ADM1-")).sort();
  const dividedSelected = zoomedIn ? selected.filter((id) => dividedCountries(geo).has(id)).sort() : [];
  const key = `${zoomedIn ? "in" : "out"}|${named.join(",")}|${picked.join(",")}|${dividedSelected.join(",")}`;

  let byKey = cache.get(geo);
  if (!byKey) {
    byKey = new Map();
    cache.set(geo, byKey);
  }
  const hit = byKey.get(key);
  if (hit) return hit;

  const divided = dividedCountries(geo);
  const keep = new Set([...picked, ...dividedSelected, ...named]);
  const children = [...geo.states, ...geo.subregions];
  const features = [
    ...geo.countries.filter((c) => !zoomedIn || !divided.has(c.properties.id) || keep.has(c.properties.id)),
    ...children.filter((f) => zoomedIn || keep.has(f.properties.id)),
    ...geo.named.filter((n) => keep.has(n.properties.id) && polarCapLatitude(n) === null),
  ];
  byKey.set(key, features);
  return features;
}

const dividedCache = new WeakMap<GeoLayers, Set<string>>();
function dividedCountries(geo: GeoLayers): Set<string> {
  let set = dividedCache.get(geo);
  if (!set) {
    set = new Set([...geo.states, ...geo.subregions].map((f) => parentOf(f.properties)).filter((p): p is string => !!p));
    dividedCache.set(geo, set);
  }
  return set;
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
