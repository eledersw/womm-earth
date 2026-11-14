import { describe, expect, it } from "vitest";
import { formatDegrees } from "./povStore";

describe("formatDegrees", () => {
  it("formats latitude with a hemisphere letter", () => {
    expect(formatDegrees(43.79, "lat")).toEqual({ value: "43.8", hemi: "N" });
    expect(formatDegrees(-33.25, "lat")).toEqual({ value: "33.3", hemi: "S" });
  });

  it("wraps longitude into -180..180 after many turns", () => {
    expect(formatDegrees(-89.6, "lng")).toEqual({ value: "89.6", hemi: "W" });
    expect(formatDegrees(270.4, "lng")).toEqual({ value: "89.6", hemi: "W" });
    expect(formatDegrees(-450, "lng")).toEqual({ value: "90.0", hemi: "W" });
  });
});
