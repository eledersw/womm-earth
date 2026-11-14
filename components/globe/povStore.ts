// The camera's point of view, shared from the globe to its read-out without
// re-rendering the globe. Updates are coalesced to one per animation frame.

export interface Pov {
  lat: number;
  lng: number;
  altitude: number;
}

let pov: Pov = { lat: 28, lng: -35, altitude: 2.3 };
let pending: Pov | null = null;
const listeners = new Set<() => void>();

export const povStore = {
  get: (): Pov => pov,
  set(next: Pov) {
    const first = pending === null;
    pending = next;
    if (!first) return;
    const flush = () => {
      if (pending) pov = pending;
      pending = null;
      listeners.forEach((l) => l());
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(flush);
    else flush();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** "43.8° N" / "89.6° W": degrees with one decimal and a hemisphere letter. */
export function formatDegrees(value: number, axis: "lat" | "lng"): { value: string; hemi: string } {
  // Longitudes from the camera can exceed ±180 after many turns.
  const v = axis === "lng" ? ((((value + 180) % 360) + 360) % 360) - 180 : value;
  const hemi = axis === "lat" ? (v >= 0 ? "N" : "S") : v >= 0 ? "E" : "W";
  return { value: Math.abs(v).toFixed(1), hemi };
}
