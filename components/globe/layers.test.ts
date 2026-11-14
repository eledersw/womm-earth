import { describe, expect, it } from "vitest";
import {
  ZOOM_STATES_ALTITUDE,
  capRings,
  penColor,
  polarCapLatitude,
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

  it("zoomed out still draws the selected states over the USA outline", () => {
    const v = ids(visibleFeatures(geo, FAR, ["US-WI", "ESP"]));
    expect(v).toEqual(expect.arrayContaining(["USA", "US-WI"]));
    expect(v).not.toContain("US-MN");
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
    oceans: [cap("OCN-SO", "ocean", -90, -50), f("OCN-NATL", "ocean")],
    named: [cap("NR-ARCTIC", "named", 66.5, 90)],
  };

  it("are never drawn as clickable polygons", () => {
    const v = ids(visibleFeatures(capGeo, FAR, ["OCN-SO", "NR-ARCTIC"]));
    expect(v).not.toContain("OCN-SO");
    expect(v).not.toContain("NR-ARCTIC");
    expect(v).toContain("OCN-NATL");
  });

  it("detects the boundary latitude", () => {
    expect(polarCapLatitude(capGeo.oceans[0])).toBe(-50);
    expect(polarCapLatitude(capGeo.named[0])).toBe(66.5);
    expect(polarCapLatitude(capGeo.oceans[1])).toBeNull();
  });

  it("selected caps become a latitude ring in their pen", () => {
    const rings = capRings(capGeo, ["ESP", "OCN-SO"]);
    expect(rings).toHaveLength(1);
    expect(rings[0].id).toBe("OCN-SO");
    expect(rings[0].pen).toBe(1);
    expect(rings[0].points.every(([lat]) => lat === -50)).toBe(true);
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
