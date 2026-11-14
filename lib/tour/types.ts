import { z } from "zod";
import { caseFromQuery, caseToQuery } from "@/lib/state/case-codec";
export const tourStepSchema = z.object({
  query: z.string().min(1).max(4000).refine((query) => { try { return caseToQuery(caseFromQuery(query)) === query; } catch { return false; } }, "Use a canonical Case query"),
  caption: z.string().trim().min(1).max(2000),
  focus: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), altitude: z.number().positive().max(10) }).strict().optional(),
  highlight: z.array(z.string().min(1).max(100)).max(20).optional(),
  reveal: z.boolean().optional(),
}).strict();
export const tourSchema = z.object({ id: z.string().min(1).max(100), title: z.string().trim().min(1).max(200), steps: z.array(tourStepSchema).min(1).max(30) }).strict();
export type TourStep = z.infer<typeof tourStepSchema>;
export type Tour = z.infer<typeof tourSchema>;
