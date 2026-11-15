import { describe, expect, it } from "vitest";
import {
  DEFAULT_CASE,
  MAX_REGIONS,
  caseFromQuery,
  caseKey,
  caseToQuery,
  normalizeCase,
  type CaseState,
} from "./case-codec";

const wisconsinSummer: CaseState = {
  variable: "AOD_55",
  regions: ["US-WI"],
  from: 2002,
  to: 2025,
  season: "JJA",
  months: null,
  level: "student",
};

describe("case-codec", () => {
  it("roundtrip", () => {
    const cases: Partial<CaseState>[] = [
      wisconsinSummer,
      { ...wisconsinSummer, regions: ["ESP", "NR-SAHEL", "US-WI"], level: "scientist" },
      { ...wisconsinSummer, season: "CUSTOM", months: [11, 12, 1] },
      {},
    ];
    for (const c of cases) {
      expect(caseFromQuery(caseToQuery(normalizeCase(c)))).toEqual(normalizeCase(c));
    }
  });

  it("dedupes, keeps insertion order, caps regions", () => {
    const c = normalizeCase({ regions: ["US-WI", "USA", "US-WI", "ESP", "FRA", "DEU"] });
    expect(c.regions).toEqual(["US-WI", "USA", "ESP", "FRA"]);
    expect(c.regions.length).toBeLessThanOrEqual(MAX_REGIONS);
  });

  it("trims and drops empty region ids", () => {
    expect(normalizeCase({ regions: [" USA ", "", "  "] }).regions).toEqual(["USA"]);
  });

  it("swaps reversed years", () => {
    const c = normalizeCase({ from: 2020, to: 1990 });
    expect([c.from, c.to]).toEqual([1990, 2020]);
  });

  it("unknown season → ANN", () => {
    expect(normalizeCase({ season: "WINTER" as never }).season).toBe("ANN");
  });

  it("months only for CUSTOM", () => {
    expect(normalizeCase({ season: "JJA", months: [6, 7, 8] }).months).toBeNull();
    expect(normalizeCase({ season: "CUSTOM", months: [6, 7, 8] }).months).toEqual([6, 7, 8]);
  });

  it("custom months keep cyclic order across the new year", () => {
    expect(normalizeCase({ season: "CUSTOM", months: [1, 11, 12] }).months).toEqual([11, 12, 1]);
  });

  it("non-contiguous custom → ANN", () => {
    const c = normalizeCase({ season: "CUSTOM", months: [1, 3, 5] });
    expect(c.season).toBe("ANN");
    expect(c.months).toBeNull();
  });

  it("CUSTOM without months → ANN", () => {
    expect(normalizeCase({ season: "CUSTOM", months: null }).season).toBe("ANN");
  });

  it("adding a region never reorders the existing ones (pens follow regions)", () => {
    const before = normalizeCase({ regions: ["ESP", "USA"] });
    const after = normalizeCase({ regions: [...before.regions, "DEU"] });
    expect(after.regions.slice(0, 2)).toEqual(before.regions);
    expect(caseKey(after)).toContain("r=ESP,USA,DEU");
  });

  it("caseKey ignores level", () => {
    expect(caseKey({ ...wisconsinSummer, level: "student" })).toBe(
      caseKey({ ...wisconsinSummer, level: "scientist" }),
    );
    expect(caseKey(wisconsinSummer)).not.toContain("lvl=");
  });

  it("query keys come in the fixed order v, r, from, to, s, m, lvl", () => {
    const q = caseToQuery({ ...wisconsinSummer, season: "CUSTOM", months: [6, 7, 8] });
    const keys = [...new URLSearchParams(q).keys()];
    expect(keys).toEqual(["v", "r", "from", "to", "s", "m", "lvl"]);
  });

  it("hand-edited share URL normalises instead of crashing", () => {
    const c = caseFromQuery("?r=USA,,US-WI,US-WI&from=2020&to=1990&s=nope&lvl=pirate&from=x");
    expect(c.regions).toEqual(["USA", "US-WI"]);
    expect([c.from, c.to]).toEqual([1990, 2020]);
    expect(c.season).toBe("ANN");
    expect(c.level).toBe("student");
  });

  it("empty query gives the default case", () => {
    expect(caseFromQuery("")).toEqual(DEFAULT_CASE);
  });
});
