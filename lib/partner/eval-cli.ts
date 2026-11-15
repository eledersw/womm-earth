import { randomUUID } from "node:crypto";
import { basename, join } from "node:path";
import { mkdir, writeFile, access } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { contextFor, evaluateQuestion, formatEvalReport, parseEvalQuestions, requireCompleteEval, type EvalResult } from "./eval";
export async function evalMain(args = process.argv.slice(2)) {
  if (args.includes("--help")) { console.log("Usage: npx tsx lib/partner/run-eval.ts --base URL [--dry-run] [--case CANONICAL_QUERY] [--output NAME.json] [--revision VERIFIED_REVISION]\nReads docs/science/EVAL.md; requires 20 complete questions and resolvable contexts. Real runs save full answers, tool evidence and rubric in lib/partner/eval-runs. Numeric report only: Sergio scores facts, causal claims and reading level; --revision is caller-supplied, not verified by the harness."); return; }
  loadEnvConfig(process.cwd());
  const rows = parseEvalQuestions(await readFile("docs/science/EVAL.md", "utf8"));
  requireCompleteEval(rows);
  const option = (flag: string) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
  const origin = new URL(option("--base") ?? (process.env.BASE_URL || "http://localhost:3000"));
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) throw new Error("Invalid evaluation base origin.");
  const query = option("--case");
  const fallback = query ? contextFor({ ...rows[0], context: query }) : undefined;
  // Resolve every context before the first request; no partial official runs.
  const contexts = rows.map((row) => contextFor(row, fallback));
  if (args.includes("--dry-run")) {
    console.log(`Complete EVAL question rows: ${rows.length}/20. Resolved Case contexts: ${contexts.length}/20. Reading levels: ${[...new Set(contexts.map((c) => c.level))].join(", ")}. No API calls made.`);
    return;
  }
  const outputName = option("--output") ?? `eval-${Date.now()}-${randomUUID().slice(0, 8)}.json`;
  if (basename(outputName) !== outputName || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.json$/.test(outputName)) throw new Error("--output must be a new JSON filename inside lib/partner/eval-runs.");
  const destination = join("lib/partner/eval-runs", outputName);
  const exists = await access(destination).then(() => true, () => false);
  if (exists) throw new Error("Evaluation output already exists; choose a new filename to preserve run history.");
  const startedAt = new Date().toISOString();
  const headers: Record<string, string> = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET } : {};
  const results: EvalResult[] = [];
  for (let i = 0; i < rows.length; i++) results.push(await evaluateQuestion(rows[i], contexts[i], origin.origin, fetch, headers));
  const record = {
    started_at: startedAt, finished_at: new Date().toISOString(), base_url: origin.origin,
    caller_supplied_deployment_revision: option("--revision") ?? null,
    remote_model_and_settings: null, remote_metadata_note: "The SSE contract does not expose deployment revision/model/settings; record verified server configuration during Sergio's review.",
    scientific_score: null,
    rows: rows.map((rubric, i) => ({ rubric, case: contexts[i], result: results[i] })),
  };
  await mkdir("lib/partner/eval-runs", { recursive: true });
  await writeFile(destination, JSON.stringify(record, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  console.log(formatEvalReport(results));
  console.log(`Full answers, rubric and tool evidence saved in ${destination}. Scientific score remains unassigned.`);
  if (results.some((r) => r.error || !r.numbersOk)) process.exitCode = 1;
}
