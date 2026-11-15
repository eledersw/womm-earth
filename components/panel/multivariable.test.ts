import { describe, expect, it } from "vitest";
import fixture from "@/api/_fixtures/analyze.json";
import type { RegionAnalysis } from "@/lib/api/types";
import { axisAngle, cellFor, radiusFor, scaleLimit, wrapLabel } from "./multivariable";

const base = fixture.results[0] as unknown as RegionAnalysis;

describe("multivariable comparison maths", () => {
  it("scores change per decade in units of year-to-year noise", () => {
    const cell = cellFor(base)!;
    expect(cell.score).toBeCloseTo(base.stats!.change_per_decade / base.stats!.resid_sd);
    expect(cell.tier).toBe(base.verdict.tier);
  });
  it("has no score for a too-short or missing result", () => {
    expect(cellFor(undefined)).toBeNull();
    expect(cellFor({ ...base, stats: null, verdict: { tier: "too_short", years_needed: null, reason: "insufficient_years" } })!.score).toBeNull();
  });
  it("picks a round symmetric limit that holds every score", () => {
    expect(scaleLimit([0.3, -0.1, null])).toBe(0.5);
    expect(scaleLimit([-1.7, 0.2])).toBe(2);
    expect(scaleLimit([null])).toBe(0.25);
  });
  it("puts no change on the middle ring and clamps beyond the rim", () => {
    expect(radiusFor(0, 2, 100)).toBe(50);
    expect(radiusFor(-2, 2, 100)).toBe(0);
    expect(radiusFor(9, 2, 100)).toBe(100);
  });
  it("starts the first axis at the top", () => {
    expect(axisAngle(0, 4)).toBeCloseTo(-Math.PI / 2);
  });
  it("wraps long axis labels onto two lines", () => {
    expect(wrapLabel("Wind speed")).toEqual(["Wind speed"]);
    expect(wrapLabel("Soil moisture at roots")).toEqual(["Soil moisture", "at roots"]);
  });
});
