import { describe, expect, it } from "vitest";
import {
  ZOOM_STATES_ALTITUDE,
  penColor,
  penIndex,
  visibleFeatures,
  type GeoLayers,
  type RegionFeature,
} from "./layers";

const f = (id: string, type: RegionFeature["properties"]["type"]): RegionFeature => ({
  type: "Feature",
  properties: { id, name: id, type },
  geometry: { type: "Polygon", coordinates: [] },
});

const geo: GeoLayers = {
  countries: [f("USA", "country"), f("ESP", "country"), f("FRA", "country")],
  states: [f("US-WI", "state"), f("US-MN", "state")],
  oceans: [f("OCN-NATL", "ocean")],
  named: [f("NR-GLOBE", "named"), f("NR-SAHEL", "named")],
};

const ids = (fs: RegionFeature[]) => fs.map((x) => x.properties.id);
const FAR = ZOOM_STATES_ALTITUDE + 1;
const NEAR = ZOOM_STATES_ALTITUDE - 0.5;

describe("visibleFeatures", () => {
  it("zoomed out shows countries and oceans, not states", () => {
    const v = ids(visibleFeatures(geo, FAR));
    expect(v).toEqual(expect.arrayContaining(["USA", "ESP", "FRA", "OCN-NATL"]));
    expect(v).not.toContain("US-WI");
  });

  it("zoomed in swaps USA for its states", () => {
    const v = ids(visibleFeatures(geo, NEAR));
    expect(v).toEqual(expect.arrayContaining(["US-WI", "US-MN", "ESP"]));
    expect(v).not.toContain("USA");
  });

  it("zoomed in keeps USA when the whole country is selected", () => {
    const v = ids(visibleFeatures(geo, NEAR, ["USA"]));
    expect(v).toContain("USA");
    expect(v).not.toContain("US-WI");
  });

  it("draws a named region only while selected, and never the whole-globe ones", () => {
    expect(ids(visibleFeatures(geo, FAR))).not.toContain("NR-SAHEL");
    const v = ids(visibleFeatures(geo, FAR, ["NR-SAHEL", "NR-GLOBE"]));
    expect(v).toContain("NR-SAHEL");
    expect(v).not.toContain("NR-GLOBE");
  });

  it("same key returns the same array reference", () => {
    expect(visibleFeatures(geo, FAR, ["ESP"])).toBe(visibleFeatures(geo, FAR + 0.3, ["ESP"]));
    expect(visibleFeatures(geo, NEAR)).toBe(visibleFeatures(geo, NEAR - 0.1));
    expect(visibleFeatures(geo, FAR)).not.toBe(visibleFeatures(geo, NEAR));
  });
});

describe("pens", () => {
  it("follow the region's position in the case", () => {
    const regions = ["ESP", "US-WI", "NR-SAHEL"];
    expect(penIndex("US-WI", regions)).toBe(1);
    expect(penColor("NR-SAHEL", regions)).toBe("var(--series-3)");
    expect(penIndex("FRA", regions)).toBeNull();
    expect(penColor("FRA", regions)).toBeNull();
  });
});
