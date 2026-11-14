import { expect, it } from "vitest";
import fixtures from "@/api/_fixtures/regions.json";
import live from "@/api/_data/regions.json";
import { caseFromQuery, caseToQuery, DEFAULT_CASE } from "@/lib/state/case-codec";
import { tourSchema } from "./types";
import { tours, currentCaseTour } from "./tours";
it("every tour step parses", () => {
  const ids = new Set([...fixtures, ...live].map((r) => r.id));
  const candidates = [...tours, currentCaseTour({ ...DEFAULT_CASE, regions: [fixtures[0].id] })];
  for (const tour of candidates) {
    const valid = tourSchema.parse(tour);
    for (const step of valid.steps) {
      const state = caseFromQuery(step.query);
      expect(caseToQuery(state)).toBe(step.query);
      expect(state.regions.every((id) => ids.has(id))).toBe(true);
      expect((step.highlight ?? []).every((id) => ids.has(id))).toBe(true);
    }
  }
});
it("does not publish unapproved demonstration cases", () => {
  expect(tours).toEqual([]);
});
it("rejects noncanonical queries, invalid camera positions and empty tours", () => {
  const guide = currentCaseTour(DEFAULT_CASE);
  expect(tourSchema.safeParse({ ...guide, steps: [] }).success).toBe(false);
  expect(tourSchema.safeParse({ ...guide, steps: [{ query: "v=T2M", caption: "A step" }] }).success).toBe(false);
  expect(tourSchema.safeParse({ ...guide, steps: [{ ...guide.steps[0], focus: { lat: 100, lng: 0, altitude: 1 } }] }).success).toBe(false);
});
