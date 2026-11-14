import { z } from "zod";
import { caseFromQuery, caseKey, type CaseState, type ReadingLevel } from "@/lib/state/case-codec";
const texts = z.object({ student: z.string().trim().min(1).max(32000), scientist: z.string().trim().min(1).max(32000) });
export const demoEntrySchema = texts.extend({ generated_at: z.iso.datetime(), approved_by: z.literal("methods-lead").nullable().default(null), regions: z.record(z.string(), texts).optional() });
export const demoCacheSchema = z.record(z.string().refine((key) => { try { return caseKey(caseFromQuery(key)) === key; } catch { return false; } }), demoEntrySchema);
export type DemoCache = z.infer<typeof demoCacheSchema>;
export function approvedDemo(cache: unknown, state: CaseState, region: string, level: ReadingLevel): string | undefined {
  if (!cache || typeof cache !== "object" || !state.regions.includes(region)) return;
  const entry = demoEntrySchema.safeParse((cache as Record<string, unknown>)[caseKey(state)]);
  if (!entry.success || entry.data.approved_by !== "methods-lead") return;
  if (entry.data.regions) return entry.data.regions[region]?.[level];
  return state.regions.length === 1 ? entry.data[level] : undefined;
}
