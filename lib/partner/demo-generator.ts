import type { Tour } from "@/lib/tour/types";
import { caseFromQuery, caseKey } from "@/lib/state/case-codec";
import type { AnalyzeResponse, Variable } from "@/lib/api/types";
import type { PartnerEvent } from "./events";
import { explainInputSchema, type ExplainInput } from "./input";
import { inspectEvidence } from "./evidence";
import { summarizeAnalysis } from "./summarize";
import { checkNumbers } from "./number-check";
import type { DemoCache } from "./demo-cache";
export async function generateDemoExplanations(tours: Tour[], dependencies: {
  variables: () => Promise<Variable[]>;
  analyze: (state: ReturnType<typeof caseFromQuery>) => Promise<AnalyzeResponse>;
  explain: (input: ExplainInput, emit: (e: PartnerEvent) => void) => Promise<void>;
  now?: () => Date;
}): Promise<DemoCache> {
  if (!tours.length) throw new Error("No approved demo tours. FINAL cases are selected, but engine alignment and Edur's captions are still required.");
  const variables = await dependencies.variables(); const cache: DemoCache = {};
  for (const tour of tours) {
    const state = caseFromQuery(tour.steps.at(-1)!.query); const key = caseKey(state);
    if (cache[key]) continue;
    const variable = variables.find((v) => v.id === state.variable);
    if (!variable || !state.regions.length) throw new Error("Demo variable/regions unavailable.");
    const analysis = await dependencies.analyze(state);
    const c = analysis.case;
    if (c.variable !== state.variable || c.start !== state.from || c.end !== state.to || c.season !== state.season || JSON.stringify(c.months ?? null) !== JSON.stringify(state.months) || JSON.stringify(c.regions) !== JSON.stringify(state.regions) || analysis.results.length !== state.regions.length || state.regions.some((id) => !analysis.results.some((r) => r.region.id === id))) throw new Error("Analysis does not match the requested demo Case.");
    const regions: NonNullable<DemoCache[string]["regions"]> = {};
    for (const result of analysis.results) {
      if (!result.stats || result.verdict.tier === "too_short") throw new Error("Demo series cannot support an explanation.");
      const evidence = inspectEvidence(result, state);
      if (!["combined", "mk_only"].includes(evidence.status) || evidence.gapped_years) throw new Error("Demo engine evidence needs alignment/review before cache generation.");
      const texts = { student: "", scientist: "" };
      for (const level of ["student", "scientist"] as const) {
        const input = explainInputSchema.parse({ mode: "explain", level, analysis: result, variable, regionName: result.region.name, period: `${state.from}–${state.to}`, seasonLabel: state.season === "CUSTOM" ? `CUSTOM (${state.months?.join(",")})` : state.season });
        let failed = false;
        await dependencies.explain(input, (event) => { if (event.type === "text") texts[level] += event.text; if (event.type === "error") failed = true; });
        if (failed || !texts[level].trim() || texts[level].length > 32000 || !checkNumbers(texts[level], [summarizeAnalysis(result, variable, result.region.name, input.period, input.seasonLabel)]).ok) throw new Error("Explanation generation or numeric verification failed. No cache was written.");
      }
      regions[result.region.id] = texts;
    }
    const joined = (level: "student" | "scientist") => analysis.results.map((r) => `${r.region.name}: ${regions[r.region.id][level]}`).join("\n\n");
    cache[key] = { student: joined("student"), scientist: joined("scientist"), generated_at: (dependencies.now?.() ?? new Date()).toISOString(), approved_by: null, regions };
  }
  return Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
}
