import { readFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { tours } from "@/lib/tour/tours";
import { caseFromQuery } from "@/lib/state/case-codec";
import { contextFor, evaluateQuestion, formatEvalReport, parseEvalQuestions, requireCompleteEval } from "./eval";
export async function evalMain(args = process.argv.slice(2)) {
  if (args.includes("--help")) { console.log("Usage: npx tsx lib/partner/run-eval.ts --base URL [--dry-run] [--case CANONICAL_QUERY]\nReads docs/science/EVAL.md; requires 20 complete questions and resolvable contexts. Numeric report only: Sergio scores facts, causal claims and reading level."); return; }
  loadEnvConfig(process.cwd());
  const rows = parseEvalQuestions(await readFile("docs/science/EVAL.md", "utf8"));
  if (args.includes("--dry-run")) { console.log(`Complete EVAL question rows: ${rows.length}/20. Reviewed tour contexts: ${tours.length}. No API calls made.`); requireCompleteEval(rows); return; }
  requireCompleteEval(rows);
  const option = (flag: string) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
  const origin = new URL(option("--base") ?? process.env.BASE_URL ?? "http://localhost:3000");
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) throw new Error("Invalid evaluation base origin.");
  const query = option("--case");
  const fallback = query ? contextFor({ ...rows[0], context: query }, tours) : tours[0] ? caseFromQuery(tours[0].steps.at(-1)!.query) : undefined;
  // Resolve every context before the first request; no partial official runs.
  const contexts = rows.map((row) => contextFor(row, tours, fallback));
  const headers: Record<string, string> = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET } : {};
  const results = [];
  for (let i = 0; i < rows.length; i++) results.push(await evaluateQuestion(rows[i], contexts[i], origin.origin, fetch, headers));
  console.log(formatEvalReport(results));
  if (results.some((r) => r.error || !r.numbersOk)) process.exitCode = 1;
}
