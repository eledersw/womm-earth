import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import { serverApi } from "../lib/api/client";
import type { AnalyzeResponse, Variable } from "../lib/api/types";
import { tours } from "../lib/tour/tours";
import { generateDemoExplanations } from "../lib/partner/demo-generator";
import { demoCacheSchema } from "../lib/partner/demo-cache";
import { streamExplain } from "../lib/partner/explain";
async function main() {
  loadEnvConfig(process.cwd());
  if (process.argv.includes("--help")) { console.log("Usage: npx tsx scripts/gen-demo-explanations.ts [--dry-run]\nNeeds approved tours, BASE_URL and ANTHROPIC_API_KEY. Generated entries remain pending Sergio's review (approved_by: null). After scientific review, keep generated_at and set approved_by to methods-lead."); return; }
  if (!tours.length) {
    console.error("No approved tours. FINAL cases are selected; engine alignment and Edur's captions are pending. No API calls or cache writes made.");
    process.exitCode = 1;
    return;
  }
  if (process.argv.includes("--dry-run")) { console.log(`${tours.length} tours ready; no API calls made.`); return; }
  if (!process.env.ANTHROPIC_API_KEY || !process.env.BASE_URL) throw new Error("BASE_URL and ANTHROPIC_API_KEY must be configured server-side.");
  const base = new URL(process.env.BASE_URL);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password) throw new Error("Invalid BASE_URL.");
  const py = serverApi(base.origin, process.env.VERCEL_AUTOMATION_BYPASS_SECRET ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET } : {});
  const generated = await generateDemoExplanations(tours, {
    variables: async () => { const { data, error } = await py.GET("/api/py/variables", { signal: AbortSignal.timeout(30000) }); if (error || !data) throw new Error("Variable catalogue unavailable."); return data as Variable[]; },
    analyze: async (c) => { const { data, error } = await py.POST("/api/py/analyze", { body: { variable: c.variable, regions: c.regions, start: c.from, end: c.to, season: c.season, months: c.months }, signal: AbortSignal.timeout(60000) }); if (error || !data) throw new Error("Demo analysis unavailable."); return data as AnalyzeResponse; },
    explain: (input, emit) => streamExplain(input, emit, AbortSignal.timeout(55000)),
  });
  const destination = resolve("lib/partner/demo-explanations.json");
  const existing = demoCacheSchema.parse(JSON.parse(await readFile(destination, "utf8")));
  const merged = demoCacheSchema.parse({ ...existing, ...generated });
  const sorted = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)));
  const temporary = `${destination}.tmp`;
  await writeFile(temporary, JSON.stringify(sorted, null, 2) + "\n", { mode: 0o600 });
  await rename(temporary, destination);
  console.log(`Generated ${Object.keys(generated).length} Cases in both levels. Pending Sergio's review, including every region's text; approved_by is null.`);
}
void main().catch(() => { console.error("Demo generation blocked or failed. Run --help and check approved tours, service availability and server-side configuration. Existing cache is unchanged."); process.exitCode = 1; });
