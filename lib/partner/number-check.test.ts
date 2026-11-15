import { describe, expect, it } from "vitest";
import { checkNumbers, collectNumbers, extractNumbers, keepGroundedLines } from "./number-check";

describe("number grounding", () => {
  it("extracts signed decimals and percents", () => {
    expect(extractNumbers("−0,04 °C/decade, +12.5%, and -2.3")).toEqual([
      { raw: "−0,04", value: -0.04, decimals: 2 },
      { raw: "+12.5%", value: 12.5, decimals: 1 },
      { raw: "-2.3", value: -2.3, decimals: 1 },
    ]);
  });
  it("handles thousands, decimal locales and scientific notation", () => {
    expect(extractNumbers("1,234.56; 1.234,56; 1 234,56; 1 234.56; 1e-3; .005").map((n) => n.value))
      .toEqual([1234.56, 1234.56, 1234.56, 1234.56, 0.001, 0.005]);
    expect(extractNumbers("1.2e-3")[0].decimals).toBe(4);
  });
  it("skips years and embedded identifiers", () => {
    expect(extractNumbers("T2M 2002–2025; 1899; 2101; AOD_55; 2002.5").map((n) => n.value))
      .toEqual([1899, 2101, 2002.5]);
  });
  it("does not skip measured values solely because their magnitude is a year", () => {
    expect(extractNumbers("2002% and 2002.0").map((n) => n.value)).toEqual([2002, 2002]);
  });
  it("matches rounded numbers", () => {
    expect(checkNumbers("about 0.04 per decade", [{ slope: 0.0412 }]).ok).toBe(true);
    expect(checkNumbers("−0.04 per decade", [{ slope: -0.0412 }]).ok).toBe(true);
  });
  it("flags invented number", () => {
    expect(checkNumbers("0.9", [0.04])).toEqual({ ok: false, unmatched: ["0.9"] });
    expect(checkNumbers("−0.04", [0.04]).ok).toBe(false);
  });
  it("keeps supported chat lines and removes a separate invented numeric suggestion", () => {
    const answer = "The measured slope is 0.04.\nTry a 30-year period.\nA longer record may help.";
    expect(keepGroundedLines(answer, [{ slope: 0.0412 }])).toBe("The measured slope is 0.04.\nA longer record may help.");
    expect(keepGroundedLines("Try a 30-year period.", [{ slope: 0.0412 }])).toBeNull();
  });
  it("compares percentages in their own precision", () => {
    expect(checkNumbers("4.1%", [{ fraction: 0.0412 }]).ok).toBe(true);
    expect(checkNumbers("4.1%", [{ percent: 4.12 }]).ok).toBe(true);
    expect(checkNumbers("4.1%", [{ fraction: 0.03 }]).ok).toBe(false);
    expect(checkNumbers("4.1 %", [{ fraction: 0.0412 }]).ok).toBe(true);
  });
  it("checks each boundary in a signed range and keeps units outside the value", () => {
    expect(checkNumbers("−0.04–0.12 °C per decade", [{ ci: [-0.041, 0.123] }]).ok).toBe(true);
    expect(checkNumbers("−0.04–0.90 °C per decade", [{ ci: [-0.041, 0.123] }]).unmatched).toEqual(["0.90"]);
  });
  it("checks p-value thresholds against actual p-values", () => {
    expect(checkNumbers("p < 0.001", [{ stats: { mk: { p: 0.00002 } } }]).ok).toBe(true);
    expect(checkNumbers("p < 0.001", [{ stats: { mk: { p: 0.02 } }, slope: 0.00002 }]).ok).toBe(false);
    expect(checkNumbers("p = 1.2e-3", [{ p: 0.00123 }]).ok).toBe(true);
  });
  it("does not approve scientific numbers without results", () => {
    expect(checkNumbers("No evidence is available.", []).ok).toBe(true);
    expect(checkNumbers("0.04 °C", []).unmatched).toEqual(["0.04"]);
    expect(checkNumbers("p < 0.001", []).ok).toBe(false);
    expect(checkNumbers("1e309", [{ slope: 0.04 }]).unmatched).toEqual(["1e309"]);
  });
  it("collects only finite numbers recursively and tolerates cycles", () => {
    const cyclic: { values: unknown[]; self?: unknown } = { values: [1, null, true, "2", { p: 0.02 }, Infinity, NaN] };
    cyclic.self = cyclic;
    expect(collectNumbers(cyclic)).toEqual([1, 0.02]);
  });
});
