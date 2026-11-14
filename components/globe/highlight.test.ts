import { describe, expect, it } from "vitest";
import { highlightIds, mirrorArcs, mirrorView } from "./highlight";

const byId = new Map([
  ["US-WI", { centroid: [-89.8, 44.6] }],
  ["ESP", { centroid: [-3.7, 40.2] }],
  ["NR-SAHEL", { centroid: [5, 14] }],
]);

describe("highlightIds", () => {
  it("mirror outlines the base and its mirrors; tour outlines its regions; none is empty", () => {
    expect([...highlightIds({ kind: "mirror", regions: ["ESP"], arcFrom: "US-WI" })].sort()).toEqual(["ESP", "US-WI"]);
    expect([...highlightIds({ kind: "tour", regions: ["NR-SAHEL"], arcFrom: null })]).toEqual(["NR-SAHEL"]);
    expect(highlightIds({ kind: null, regions: ["ESP"], arcFrom: null }).size).toBe(0);
  });
});

describe("mirrorArcs", () => {
  it("draws one arc from the base to each mirror, lat/lng from [lng, lat] centroids", () => {
    expect(mirrorArcs({ kind: "mirror", regions: ["ESP", "NR-SAHEL"], arcFrom: "US-WI" }, byId)).toEqual([
      { id: "US-WI>ESP", startLat: 44.6, startLng: -89.8, endLat: 40.2, endLng: -3.7 },
      { id: "US-WI>NR-SAHEL", startLat: 44.6, startLng: -89.8, endLat: 14, endLng: 5 },
    ]);
  });

  it("draws nothing for tours, a missing base, or unknown regions", () => {
    expect(mirrorArcs({ kind: "tour", regions: ["ESP"], arcFrom: "US-WI" }, byId)).toEqual([]);
    expect(mirrorArcs({ kind: "mirror", regions: ["ESP"], arcFrom: null }, byId)).toEqual([]);
    expect(mirrorArcs({ kind: "mirror", regions: ["XXX"], arcFrom: "US-WI" }, byId)).toEqual([]);
  });
});

describe("mirrorView", () => {
  it("frames the base and its first mirror, pulled back to see both", () => {
    const v = mirrorView(mirrorArcs({ kind: "mirror", regions: ["ESP"], arcFrom: "US-WI" }, byId));
    expect(v?.lat).toBeCloseTo(42.4, 1);
    expect(v?.lng).toBeCloseTo(-46.75, 1);
    expect(v?.altitude).toBeGreaterThanOrEqual(1.8);
    expect(mirrorView([])).toBeNull();
  });
});
