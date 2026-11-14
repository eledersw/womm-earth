// What the globe draws for a highlight set by the panel (mirror finder) or the
// tour (Task 6). Pure, so it is tested without WebGL.
import { regionLatLng } from "@/lib/api/region-geo";
import type { Highlight } from "@/lib/state/ui-store";

export interface MirrorArc {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}

type CentroidIndex = ReadonlyMap<string, { centroid: [number, number] | number[] }>;

/** Regions to outline: a mirror's base and its mirrors, or a tour step's regions. */
export function highlightIds(h: Highlight): Set<string> {
  if (!h.kind) return new Set();
  return new Set(h.kind === "mirror" && h.arcFrom ? [h.arcFrom, ...h.regions] : h.regions);
}

/** One arc from the mirror's base to each mirror region (mirror view only). */
export function mirrorArcs(h: Highlight, byId: CentroidIndex): MirrorArc[] {
  if (h.kind !== "mirror" || !h.arcFrom) return [];
  const base = byId.get(h.arcFrom);
  if (!base) return [];
  const from = regionLatLng(base);
  return h.regions.flatMap((id) => {
    const r = byId.get(id);
    if (!r || id === h.arcFrom) return [];
    const to = regionLatLng(r);
    return [{ id: `${h.arcFrom}>${id}`, startLat: from.lat, startLng: from.lng, endLat: to.lat, endLng: to.lng }];
  });
}

/** A camera that frames the base and its first mirror: midpoint, pulled back by their distance. */
export function mirrorView(arcs: readonly MirrorArc[]): { lat: number; lng: number; altitude: number } | null {
  const a = arcs[0];
  if (!a) return null;
  let dLng = a.endLng - a.startLng;
  if (dLng > 180) dLng -= 360;
  if (dLng < -180) dLng += 360;
  const lng = a.startLng + dLng / 2;
  const span = Math.hypot(a.endLat - a.startLat, dLng);
  return { lat: (a.startLat + a.endLat) / 2, lng: ((lng + 540) % 360) - 180, altitude: Math.min(3, Math.max(1.8, span / 40)) };
}
