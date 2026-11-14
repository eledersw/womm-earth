import { describe, expect, it } from "vitest";
import { regionLatLng } from "./region-geo";

describe("regionLatLng", () => {
  it("reads the API centroid as [lng, lat] (GeoJSON order)", () => {
    // Real /api/py/regions value for Wisconsin
    const wi = { centroid: [-89.72309, 44.89023] as [number, number] };
    expect(regionLatLng(wi)).toEqual({ lat: 44.89023, lng: -89.72309 });
  });
});
