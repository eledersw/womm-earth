import { caseFromQuery, caseToQuery, type CaseState } from "@/lib/state/case-codec";
import type { Tour } from "@/lib/tour/types";
import { readSse } from "./sse-client";
import { checkNumbers } from "./number-check";
export type EvalQuestion = { id: number; question: string; context: string; keyFacts: string; mustNotSay: string };
export type EvalResult = { id: number; question: string; answer: string; numbersOk: boolean; unmatched: string[]; error: boolean };
function cells(line: string) {
  const result: string[] = []; let cell = ""; let escaped = false;
  for (const char of line.trim().replace(/^\||\|$/g, "")) {
    if (char === "|" && !escaped) { result.push(cell.trim()); cell = ""; }
    else { cell += char; }
    if (char === "\\" && !escaped) escaped = true; else escaped = false;
  }
  result.push(cell.trim()); return result;
}
export function parseEvalQuestions(markdown: string): EvalQuestion[] {
  return markdown.split(/\r?\n/).filter((line) => /^\|\s*\d+\s*\|/.test(line)).flatMap((line) => {
    const [id, question, context, keyFacts, mustNotSay = ""] = cells(line);
    if (!question || /_fill_|_write\b/i.test(question) || !context || !keyFacts || /_fill_/i.test(`${context} ${keyFacts} ${mustNotSay}`)) return [];
    return [{ id: Number(id), question, context, keyFacts, mustNotSay }];
  });
}
export function requireCompleteEval(rows: EvalQuestion[]) {
  if (rows.length !== 20 || new Set(rows.map((r) => r.id)).size !== 20 || rows.some((r) => r.id < 1 || r.id > 20 || r.question.length > 6000)) throw new Error(`EVAL.md has ${rows.length}/20 complete question rows. Sergio must finish the rubric before the official run.`);
}
export function contextFor(row: EvalQuestion, tours: Tour[], fallback?: CaseState): CaseState {
  const context = row.context.replace(/^`|`$/g, "").trim();
  if (context.startsWith("v=")) { const parsed = caseFromQuery(context); if (caseToQuery(parsed) !== context) throw new Error("Noncanonical eval Case context."); return parsed; }
  if (/^any$/i.test(context) && fallback) return fallback;
  const numbered = /^case\s+(\d+)$/i.exec(context);
  const tour = numbered ? tours[Number(numbered[1]) - 1] : tours.find((t) => t.id === context);
  if (!tour) throw new Error(`Unresolved evaluation context for question ${row.id}; supply reviewed tours or an explicit Case query.`);
  return caseFromQuery(tour.steps.at(-1)!.query);
}
export async function evaluateQuestion(row: EvalQuestion, state: CaseState, base: string, fetcher: typeof fetch = fetch, headers: Record<string, string> = {}): Promise<EvalResult> {
  let answer = ""; let failed = false; let done = false; const results: unknown[] = [];
  const signal = AbortSignal.timeout(65000);
  try {
    const response = await fetcher(new URL("/api/partner", base), { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify({ mode: "chat", level: state.level, case: state, messages: [{ role: "user", content: row.question }] }), signal, redirect: "error" });
    await readSse(response, (event) => {
      if (event.type === "text") { answer += event.text; if (answer.length > 64000) throw new Error("Response limit"); }
      if (event.type === "tool_result") results.push(event.data);
      if (event.type === "error") failed = true;
      if (event.type === "done") done = true;
    }, { signal });
  } catch { failed = true; }
  if (!done || !answer.trim()) failed = true;
  if (failed) return { id: row.id, question: row.question, answer: "", numbersOk: false, unmatched: [], error: true };
  const numbers = checkNumbers(answer, results);
  return { id: row.id, question: row.question, answer, numbersOk: numbers.ok, unmatched: numbers.unmatched, error: false };
}
const escapeCell = (text: string) => text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export function formatEvalReport(rows: EvalResult[]) {
  return ["| # | question | numbers ok | unmatched | answer (first 200 chars) |", "|---|---|---|---|---|", ...rows.map((r) => `| ${r.id} | ${escapeCell(r.question)} | ${r.error ? "ERROR" : r.numbersOk ? "yes" : "no"} | ${escapeCell(r.unmatched.join(", "))} | ${escapeCell(r.error ? "Request failed; no answer scored." : r.answer.slice(0, 200))} |`), "", "Numeric checks only. Facts, forbidden claims and reading level require Sergio's review. No overall accuracy score has been assigned."].join("\n");
}
