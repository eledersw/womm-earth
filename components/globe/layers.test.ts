import { describe, expect, it } from "vitest";
import {
  ZOOM_STATES_ALTITUDE,
  capRings,
  penColor,
  polarCapLatitude,
  penIndex,
  parentOf,
  visibleFeatures,
  type GeoLayers,
  type RegionFeature,
} from "./layers";

const f = (id: string, type: RegionFeature["properties"]["type"], parent?: string): RegionFeature => ({
  type: "Feature",
  properties: { id, name: id, type, ...(parent ? { parent } : {}) },
  geometry: { type: "Polygon", coordinates: [] },
});

const geo: GeoLayers = {
  countries: [f("USA", "country"), f("ESP", "country"), f("FRA", "country"), f("BRA", "country")],
  states: [f("US-WI", "state"), f("US-MN", "state")],
  subregions: [f("ADM1-BRA-north", "subregion", "BRA"), f("ADM1-BRA-south", "subregion", "BRA")],
  named: [f("NR-GLOBE", "named"), f("NR-SAHEL", "named")],
};

const ids = (fs: RegionFeature[]) => fs.map((x) => x.properties.id);
const FAR = ZOOM_STATES_ALTITUDE + 1;
const NEAR = ZOOM_STATES_ALTITUDE - 0.5;

describe("visibleFeatures", () => {
  it("zoomed out shows whole countries, not their regions", () => {
    const v = ids(visibleFeatures(geo, FAR));
    expect(v).toEqual(expect.arrayContaining(["USA", "ESP", "BRA"]));
    expect(v).not.toContain("US-WI");
    expect(v).not.toContain("ADM1-BRA-north");
  });

  it("zoomed in swaps every divided country for its regions", () => {
    const v = ids(visibleFeatures(geo, NEAR));
    expect(v).toEqual(expect.arrayContaining(["US-WI", "US-MN", "ADM1-BRA-north", "ADM1-BRA-south", "ESP"]));
    expect(v).not.toContain("USA");
    expect(v).not.toContain("BRA");
  });

  it("zoomed in keeps a selected divided country with its regions on top, so a region can be picked", () => {
    const v = ids(visibleFeatures(geo, NEAR, ["BRA"]));
    expect(v).toEqual(expect.arrayContaining(["BRA", "ADM1-BRA-north", "ADM1-BRA-south"]));
  });

  it("zoomed out draws selected regions over their country, and no other regions", () => {
    const v = ids(visibleFeatures(geo, FAR, ["US-WI", "ADM1-BRA-north"]));
    expect(v).toEqual(expect.arrayContaining(["USA", "US-WI", "BRA", "ADM1-BRA-north"]));
    expect(v).not.toContain("US-MN");
    expect(v).not.toContain("ADM1-BRA-south");
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

  it("US states belong to the USA", () => {
    expect(parentOf({ id: "US-WI", name: "Wisconsin", type: "state" })).toBe("USA");
    expect(parentOf({ id: "ADM1-BRA-north", name: "North", type: "subregion", parent: "BRA" })).toBe("BRA");
    expect(parentOf({ id: "ESP", name: "Spain", type: "country" })).toBeUndefined();
  });
});

describe("polar caps (regions wrapping 360° around a pole)", () => {
  // A cap the globe library can't fill: it paints the complement (the whole planet).
  const cap = (id: string, type: RegionFeature["properties"]["type"], lat0: number, lat1: number): RegionFeature => ({
    type: "Feature",
    properties: { id, name: id, type },
    geometry: {
      type: "Polygon",
      coordinates: [[[-180, lat0], [180, lat0], [180, lat1], [-180, lat1], [-180, lat0]]],
    },
  });
  const capGeo: GeoLayers = {
    countries: [f("ESP", "country")],
    states: [],
    subregions: [],
    named: [cap("NR-ARCTIC", "named", 66.5, 90), f("NR-SAHEL", "named")],
  };

  it("are never drawn as clickable polygons", () => {
    const v = ids(visibleFeatures(capGeo, FAR, ["NR-ARCTIC", "NR-SAHEL"]));
    expect(v).not.toContain("NR-ARCTIC");
    expect(v).toContain("NR-SAHEL");
  });

  it("detects the boundary latitude", () => {
    expect(polarCapLatitude(capGeo.named[0])).toBe(66.5);
    expect(polarCapLatitude(capGeo.named[1])).toBeNull();
  });

  it("selected caps become a latitude ring in their pen", () => {
    const rings = capRings(capGeo, ["ESP", "NR-ARCTIC"]);
    expect(rings).toHaveLength(1);
    expect(rings[0].id).toBe("NR-ARCTIC");
    expect(rings[0].pen).toBe(1);
    expect(rings[0].points.every(([lat]) => lat === 66.5)).toBe(true);
    const lngs = rings[0].points.map(([, lng]) => lng);
    expect(Math.min(...lngs)).toBe(-180);
    expect(Math.max(...lngs)).toBe(180);
  });

  it("unselected caps draw nothing", () => {
    expect(capRings(capGeo, ["ESP"])).toEqual([]);
  });

  it("whole-earth regions are not caps (selectable, never drawn)", () => {
    const land = { ...cap("NR-LAND", "named", -90, 83.6) };
    expect(polarCapLatitude(land)).toBeNull();
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
