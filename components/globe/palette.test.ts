import { describe, expect, it } from "vitest";
import type { TrendMapEntry } from "@/lib/api/types";
import { colorFor, domainFor, mixHex, MUTE, type TrendRamp } from "./palette";

const ramp: TrendRamp = {
  up: ["#9c3b2f", "#d55c3f", "#f59a73"],
  down: ["#2f64a0", "#4f95d6", "#9ccbf0"],
  neutral: "#46525a",
};
const entry = (slope: number, q = 0.01, tier: TrendMapEntry["tier"] = "confirmed"): TrendMapEntry => ({
  slope_per_decade: slope,
  p: q,
  q,
  tier,
});

describe("colorFor", () => {
  it("no data is neutral", () => {
    expect(colorFor(undefined, 1, ramp)).toBe(ramp.neutral);
  });

  it("hidden overrides any trend (predict before reveal)", () => {
    expect(colorFor(entry(0.9), 1, ramp, { hidden: true })).toBe(ramp.neutral);
  });

  it("strength picks the step: weak, middle, strong", () => {
    expect(colorFor(entry(0.1), 1, ramp)).toBe(ramp.up[0]);
    expect(colorFor(entry(0.5), 1, ramp)).toBe(ramp.up[1]);
    expect(colorFor(entry(0.9), 1, ramp)).toBe(ramp.up[2]);
    expect(colorFor(entry(-0.9), 1, ramp)).toBe(ramp.down[2]);
    expect(colorFor(entry(5), 1, ramp)).toBe(ramp.up[2]); // clipped at the domain
  });

  it("wet variables flip the ramp: wetter reads blue", () => {
    expect(colorFor(entry(0.9), 1, ramp, { upIsWet: true })).toBe(ramp.down[2]);
    expect(colorFor(entry(-0.9), 1, ramp, { upIsWet: true })).toBe(ramp.up[2]);
  });

  it("non-significant is muted toward neutral", () => {
    expect(colorFor(entry(0.9, 0.2), 1, ramp)).toBe(mixHex(ramp.up[2], ramp.neutral, MUTE));
  });

  it("too short to judge is neutral", () => {
    expect(colorFor(entry(0.9, 0.01, "too_short"), 1, ramp)).toBe(ramp.neutral);
  });
});

describe("domainFor", () => {
  it("ignores outliers (95th percentile of |slope|)", () => {
    const entries = Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [`R${i}`, entry(i < 39 ? (i % 2 ? 1 : -1) * 0.5 : 50)]),
    );
    expect(domainFor(entries)).toBeCloseTo(0.5);
  });

  it("never returns zero", () => {
    expect(domainFor({})).toBeGreaterThan(0);
    expect(domainFor({ A: entry(0) })).toBeGreaterThan(0);
  });
});

describe("mixHex", () => {
  it("blends two colours", () => {
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mixHex("#123456", "#abcdef", 0)).toBe("#123456");
  });
});
