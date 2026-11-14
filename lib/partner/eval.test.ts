import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { caseFromQuery } from "@/lib/state/case-codec";
import { contextFor, evaluateQuestion, formatEvalReport, parseEvalQuestions, requireCompleteEval, type EvalQuestion } from "./eval";
const query = "v=T2M&r=US-WI&from=2002&to=2025&s=JJA&lvl=student";
const state = caseFromQuery(query);
const row: EvalQuestion = { id: 1, question: "What is the evidence?", context: query, keyFacts: "Trend evidence", mustNotSay: "Causal certainty" };
const response = (...events: unknown[]) => new Response(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""), { headers: { "content-type": "text/event-stream" } });
it("counts the real complete rubric rows and rejects an incomplete or duplicate official eval", () => {
  const current = parseEvalQuestions(readFileSync("docs/science/EVAL.md", "utf8"));
  expect(current).toHaveLength(3);
  expect(() => requireCompleteEval(current)).toThrow("3/20");
  const complete = Array.from({ length: 20 }, (_, i) => ({ ...row, id: i + 1 }));
  expect(() => requireCompleteEval(complete)).not.toThrow();
  expect(() => requireCompleteEval([...complete.slice(1), complete[1]])).toThrow();
  expect(parseEvalQuestions('| 1 | A \\| B? | any | Required facts | Forbidden | | |')[0].question).toBe('A \\| B?');
});
it("resolves canonical queries and reviewed tours without silently inventing a Case", () => {
  const tours = [{ id: "reviewed", title: "Reviewed", steps: [{ query, caption: "Reviewed" }] }];
  expect(contextFor(row, [])).toEqual(state);
  expect(contextFor({ ...row, context: "Case 1" }, tours)).toEqual(state);
  expect(contextFor({ ...row, context: "reviewed" }, tours)).toEqual(state);
  expect(contextFor({ ...row, context: "any" }, [], state)).toEqual(state);
  expect(() => contextFor({ ...row, context: "Case 1" }, [])).toThrow("Unresolved");
  expect(() => contextFor({ ...row, context: "v=T2M" }, [])).toThrow("Noncanonical");
});
it("checks streamed answers against actual tool results and posts the selected context", async () => {
  const fetcher = vi.fn<typeof fetch>(async () => response({ type: "tool_result", name: "analyze_case", data: { p: 0.01 } }, { type: "text", text: "Mann-Kendall: p = 0.01." }, { type: "done" }));
  const result = await evaluateQuestion(row, state, "http://localhost:3000", fetcher);
  expect(result).toMatchObject({ numbersOk: true, error: false, unmatched: [] });
  expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string)).toMatchObject({ mode: "chat", case: state, level: "student" });
  const unsupported = await evaluateQuestion(row, state, "http://localhost:3000", async () => response({ type: "text", text: "Slope 98765.4321." }, { type: "done" }));
  expect(unsupported).toMatchObject({ numbersOk: false, unmatched: ["98765.4321"], error: false });
});
it.each(["http", "truncated", "error", "malformed"])("discards %s responses rather than scoring partial text", async (failure) => {
  const fetcher: typeof fetch = async () => {
    if (failure === "http") return new Response("private failure", { status: 500 });
    if (failure === "malformed") return response({ type: "unknown" });
    return response({ type: "text", text: "Partial answer." }, ...(failure === "error" ? [{ type: "error", message: "Failure" }, { type: "done" }] : []));
  };
  expect(await evaluateQuestion(row, state, "http://localhost:3000", fetcher)).toMatchObject({ error: true, numbersOk: false, answer: "" });
});
it("escapes report cells, limits answer excerpts, and leaves the scientific score to Sergio", () => {
  const report = formatEvalReport([{ id: 1, question: "A | B?\n<script>", answer: "x".repeat(250), numbersOk: true, unmatched: [], error: false }]);
  expect(report).toContain("A \\| B? &lt;script&gt;");
  expect(report).toContain("x".repeat(200));
  expect(report).not.toContain("x".repeat(201));
  expect(report).toContain("No overall accuracy score has been assigned");
});
