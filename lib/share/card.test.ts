import { describe, expect, it } from "vitest";
import type { RegionAnalysis, Variable } from "@/lib/api/types";
import { normalizeCase } from "@/lib/state/case-codec";
import { cardFileName, cardModel, cardPath, sparklines } from "./card";

const state = normalizeCase({ variable: "T2M", regions: ["BEL", "NLD"], from: 2000, to: 2020, season: "ANN" });
const variable = { id: "T2M", name: "Temperature at 2 m", unit: "C" } as Variable;

function result(id: string, name: string, tier: RegionAnalysis["verdict"]["tier"], slope: number): RegionAnalysis {
  return {
    region: { id, name }, verdict: { tier, reason: null, years_needed: null },
    stats: { change_per_decade: slope, n_years: 21, mk: { p: 0.0431 } },
    yearly: [{ year: 2000, value: 10 }, { year: 2001, value: null }, { year: 2002, value: 11 }],
  } as unknown as RegionAnalysis;
}

describe("share card", () => {
  it("shows each region's verdict, change per decade and evidence in Case order", () => {
    const model = cardModel(state, variable, [result("BEL", "Belgium", "not_proven", 0.442), result("NLD", "Netherlands", "no_case", -0.05)]);
    expect(model.ready).toBe(true);
    expect(model.subtitle).toBe("2000–2020 · Annual");
    expect(model.rows.map((r) => [r.name, r.pen, r.tierLabel, r.change])).toEqual([
      ["Belgium", 0, "Not proven yet", "+0.44 °C"],
      ["Netherlands", 1, "No case", "−0.050 °C"],
    ]);
    expect(model.rows[0].evidence).toBe("MK p 0.0431 · 21 years");
    expect(model.rows[0].values).toEqual([10, null, 11]);
  });

  it("without results names the Case's places and says the verdict is in the app", () => {
    const model = cardModel(state, variable, null, { BEL: "Belgium" });
    expect(model.ready).toBe(false);
    expect(model.rows.map((r) => [r.name, r.tier, r.change])).toEqual([["Belgium", null, ""], ["NLD", null, ""]]);
  });

  it("too-short series show no estimate", () => {
    expect(cardModel(state, variable, [result("BEL", "Belgium", "too_short", 0.4)]).rows[0].change).toBe("");
  });

  it("sparklines split at gaps and skip lone points", () => {
    expect(sparklines([1, 2, null, 3], 100, 20)).toHaveLength(1);
    expect(sparklines([1, 2, null, 3, 4], 100, 20)).toHaveLength(2);
    expect(sparklines([1], 100, 20)).toEqual([]);
  });

  it("card URL and file name follow the Case", () => {
    expect(cardPath(state)).toBe("/api/card?v=T2M&r=BEL,NLD&from=2000&to=2020&s=ANN&lvl=student");
    expect(cardPath(state, { wait: true })).toMatch(/&wait=1$/);
    expect(cardFileName(state)).toBe("womm-earth-t2m-bel-nld-2000-2020.png");
  });
});
