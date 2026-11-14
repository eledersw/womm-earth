import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { BetaRunnableTool } from "@anthropic-ai/sdk/lib/tools/BetaRunnableTool";
import { z } from "zod";
import type { serverApi } from "@/lib/api/client";
import type { RegionAnalysis } from "@/lib/api/types";
import { caseToQuery, normalizeCase, SEASONS, type ReadingLevel } from "@/lib/state/case-codec";
import { summarizeAnalysis } from "./summarize";
import type { PartnerEvent } from "./events";
import cards from "./process-cards.json";
const id = z.string().min(1).max(100);
const year = z.number().int().min(1000).max(2200);
const period = { from: year, to: year };
const season = z.enum(SEASONS);
const months = z.array(z.number().int().min(1).max(12)).min(1).max(12).optional();
const caseFields = { variable: id, regions: z.array(id).min(1).max(4), ...period, season, months };
export function makeTools(py: ReturnType<typeof serverApi>, emit: (e: PartnerEvent) => void, signal?: AbortSignal, level: ReadingLevel = "student"): BetaRunnableTool[] {
  let calls = 0;
  const requestSignal = () => signal ? AbortSignal.any([signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000);
  const variables = async () => { const { data, error } = await py.GET("/api/py/variables", { signal: requestSignal() }); if (error || !data) throw new Error("catalogue"); return data; };
  const regions = async () => { const { data, error } = await py.GET("/api/py/regions", { signal: requestSignal() }); if (error || !data) throw new Error("catalogue"); return data; };
  async function validate(variable: string, ids: string[], from: number, to: number) {
    const [vs, rs] = await Promise.all([variables(), regions()]);
    const v = vs.find((v) => v.id === variable);
    if (!v) throw new Error(`Unknown variable: ${variable}`);
    const unknown = ids.filter((id) => !rs.some((r) => r.id === id));
    if (unknown.length) return { error: `Unknown regions: ${unknown.join(", ")}` } as const;
    if (from > to || from < v.start_year || to > v.end_year) throw new Error("period");
    return { variable: v };
  }
  function define<S extends z.ZodType>(name: string, inputSchema: S, description: string, run: (input: z.infer<S>) => Promise<unknown>) {
    return betaZodTool({ name, inputSchema, description, eager_input_streaming: true, run: async (input) => {
      signal?.throwIfAborted(); emit({ type: "tool_call", name });
      let result: unknown;
      try { if (++calls > 20) throw new Error("tool limit"); result = await run(input); }
      catch { result = { error: "Tool unavailable or invalid parameters. Try another Case." }; }
      signal?.throwIfAborted();
      let json = JSON.stringify(result);
      if (new TextEncoder().encode(json).byteLength > 128 * 1024) { result = { error: "Tool result exceeds the response limit." }; json = JSON.stringify(result); }
      emit({ type: "tool_result", name, data: result }); return json;
    } });
  }
  function normalized(input: { variable: string; regions: string[]; from: number; to: number; season: z.infer<typeof season>; months?: number[] }) {
    const next = normalizeCase({ ...input, months: input.months ?? null, level });
    if (input.from > input.to || (input.season === "CUSTOM" && next.season !== "CUSTOM")) throw new Error("invalid period/months");
    return next;
  }
  return [
    define("list_variables", z.object({}).strict(), "List available variable ids, names, units and source kinds.", async () => (await variables()).map(({ id, name, unit, kind }) => ({ id, name, unit, kind }))),
    define("analyze_case", z.object(caseFields).strict(), "Run yearly trend analysis for 1-4 regions. Returns Sen slope per decade, Hamed-Rao Mann-Kendall and OLS AR(1) p-values, verdict and conditional years estimate.", async (input) => {
      const c = normalized(input); const checked = await validate(c.variable, c.regions, c.from, c.to);
      if ("error" in checked) return checked;
      const { data, error } = await py.POST("/api/py/analyze", { body: { variable: c.variable, regions: c.regions, start: c.from, end: c.to, season: c.season, months: c.months }, signal: requestSignal() });
      if (error || !data) throw new Error("analysis");
      return { results: data.results.map((r) => summarizeAnalysis(r as RegionAnalysis, checked.variable, r.region.name, `${c.from}–${c.to}`, c.season)) };
    }),
    define("correlate", z.object({ var_x: id, var_y: id, region: id, ...period }).strict(), "Correlate two variables; correlation does not establish causation.", async (input) => {
      for (const v of [input.var_x, input.var_y]) { const checked = await validate(v, [input.region], input.from, input.to); if ("error" in checked) return checked; }
      const { data, error } = await py.POST("/api/py/correlate", { body: { var_x: input.var_x, var_y: input.var_y, region: input.region, start: input.from, end: input.to, season: "ANN", max_lag: 6 }, signal: requestSignal() });
      if (error || !data) throw new Error("correlation");
      const { scatter: _scatter, ...summary } = data; void _scatter; return summary;
    }),
    define("find_mirror", z.object({ variable: id, region: id, ...period, season }).strict(), "Find opposite-trend regions for a standard season (CUSTOM requires explicit months and is not supported here).", async (input) => {
      if (input.season === "CUSTOM") throw new Error("months required");
      const checked = await validate(input.variable, [input.region], input.from, input.to); if ("error" in checked) return checked;
      const { data, error } = await py.POST("/api/py/mirror", { body: { variable: input.variable, regions: [input.region], start: input.from, end: input.to, season: input.season }, signal: requestSignal() });
      if (error || !data) throw new Error("mirror"); return data;
    }),
    define("scan_region", z.object({ region: id, ...period }).strict(), "Scan variables in a region; availability depends on the backend.", async (input) => {
      if (input.from > input.to || !(await regions()).some((r) => r.id === input.region)) throw new Error("region/period");
      const { data, error } = await py.POST("/api/py/scan", { body: { region: input.region, start: input.from, end: input.to }, signal: requestSignal() });
      if (error || !data) throw new Error("scan"); return data;
    }),
    define("get_process_card", z.object({ id }).strict(), "Return a curated process card by id, or available ids. Empty means no curated physical explanation is available.", async ({ id }) => {
      const list = cards as { id: string; [key: string]: unknown }[];
      return list.find((card) => card.id === id) ?? { available_ids: list.map((card) => card.id) };
    }),
    define("propose_case", z.object({ ...caseFields, regions: z.array(id).min(1).max(20), title: z.string().min(1).max(160) }).strict(), "Propose a Case for explicit user approval. Validate all ids, then keep at most 4 regions. Does not change the active Case.", async (input) => {
      const checked = await validate(input.variable, input.regions, input.from, input.to); if ("error" in checked) return checked;
      const c = normalized(input);
      emit({ type: "propose_case", query: caseToQuery(c), title: input.title }); return "proposed";
    }),
  ];
}
