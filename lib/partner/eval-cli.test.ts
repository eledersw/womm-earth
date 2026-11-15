import { readFileSync } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { evalMain } from "./eval-cli";
import { evaluateQuestion } from "./eval";
vi.mock("node:fs/promises", () => ({ access: vi.fn(), mkdir: vi.fn(), readFile: vi.fn(), writeFile: vi.fn() }));
vi.mock("@next/env", () => ({ loadEnvConfig: vi.fn() }));
vi.mock("./eval", async (original) => ({ ...await original<typeof import("./eval")>(), evaluateQuestion: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BASE_URL", "http://localhost:3000");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.mocked(readFile).mockResolvedValue(readFileSync("docs/science/EVAL.md", "utf8"));
  vi.mocked(access).mockRejectedValue(Object.assign(new Error("absent"), { code: "ENOENT" }));
  vi.mocked(mkdir).mockResolvedValue(undefined);
  vi.mocked(writeFile).mockResolvedValue(undefined);
  vi.mocked(evaluateQuestion).mockImplementation(async (row) => ({ id: row.id, question: row.question, answer: "Complete answer. ".repeat(30), toolResults: [{ p: 0.01 }], numbersOk: true, unmatched: [], error: false }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
it("preflights all twenty contexts offline without calls or report writes", async () => {
  await evalMain(["--dry-run"]);
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Resolved Case contexts: 20/20"));
  expect(evaluateQuestion).not.toHaveBeenCalled();
  expect(writeFile).not.toHaveBeenCalled();
});
it("persists complete answers, rubric, Case and evidence without assigning a scientific score", async () => {
  await evalMain(["--base", "http://localhost:3000", "--output", "review-test.json", "--revision", "caller-revision"]);
  expect(evaluateQuestion).toHaveBeenCalledTimes(20);
  const [path, raw, options] = vi.mocked(writeFile).mock.calls[0];
  expect(String(path).replaceAll("\\", "/")).toBe("lib/partner/eval-runs/review-test.json");
  expect(options).toEqual({ flag: "wx", mode: 0o600 });
  const record = JSON.parse(raw as string);
  expect(record.scientific_score).toBeNull();
  expect(record.remote_model_and_settings).toBeNull();
  expect(record.caller_supplied_deployment_revision).toBe("caller-revision");
  expect(record.rows).toHaveLength(20);
  expect(record.rows[0].result.answer.length).toBeGreaterThan(200);
  expect(record.rows[0].result.toolResults).toEqual([{ p: 0.01 }]);
  expect(record.rows[0].rubric.keyFacts).toBeTruthy();
});
it("rejects an existing output or a path outside the owned run directory before calls", async () => {
  vi.mocked(access).mockResolvedValue(undefined);
  await expect(evalMain(["--output", "existing.json"])).rejects.toThrow("already exists");
  await expect(evalMain(["--output", "../../docs/science/EVAL.json"])).rejects.toThrow("new JSON filename");
  expect(evaluateQuestion).not.toHaveBeenCalled();
  expect(writeFile).not.toHaveBeenCalled();
});
