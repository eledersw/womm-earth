import data from "./tours.json";
import { tourSchema, type Tour } from "./types";
import { caseToQuery, type CaseState } from "@/lib/state/case-codec";
import { tourCopy } from "@/lib/copy/tour";
// Only FINAL cases with Story captions belong in this collection. The source
// docs are still drafts, so there are no published demonstration claims yet.
export const tours: Tour[] = data.map((tour) => tourSchema.parse(tour));
// A procedural guide to the user's current Case, not a scientific demo case.
export function currentCaseTour(state: CaseState): Tour {
  const query = caseToQuery(state);
  return { id: "current-case-guide", title: tourCopy.currentTitle, steps: tourCopy.captions.map((caption) => ({ query, caption })) };
}
