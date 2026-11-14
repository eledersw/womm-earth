import { afterEach, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import type { serverApi } from "@/lib/api/client";
import { DEFAULT_CASE } from "@/lib/state/case-codec";
import { getClient } from "./anthropic";
import { streamChat } from "./chat";
import { chatInputSchema } from "./chat-input";
import type { PartnerEvent } from "./events";
vi.mock("./anthropic", () => ({ getClient: vi.fn(), MODEL: "claude-opus-5-5", FALLBACK: { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } }));
afterEach(() => vi.resetAllMocks());
const input = chatInputSchema.parse({ mode: "chat", level: "student", case: DEFAULT_CASE, messages: [{ role: "user", content: "What can I investigate?" }] });
const py = {} as ReturnType<typeof serverApi>;
function setup(stop = "end_turn", text = "Choose a variable and a place.") {
  const runner = vi.fn(() => ({ async *[Symbol.asyncIterator]() { yield {
    async *[Symbol.asyncIterator]() { yield { type: "content_block_delta", delta: { type: "text_delta", text } }; },
    finalMessage: async () => ({ stop_reason: stop, content: [] }),
  }; } }));
  vi.mocked(getClient).mockReturnValue({ beta: { messages: { toolRunner: runner } } } as unknown as Anthropic);
  return runner;
}
it("uses the planned runner and prepends Case context without mutating history", async () => {
  const runner = setup(); const events: PartnerEvent[] = []; await streamChat(input, py, (e) => events.push(e));
  expect(events.map((e) => e.type)).toEqual(["text"]);
  expect(runner).toHaveBeenCalledWith(expect.objectContaining({ model: "claude-opus-5-5", max_tokens: 16000, max_iterations: 6, stream: true, output_config: { effort: "medium" }, tools: expect.any(Array), messages: [expect.objectContaining({ content: expect.stringContaining("Current Case") })] }), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(input.messages[0].content).toBe("What can I investigate?");
});
it.each(["refusal", "max_tokens", "tool_use"])("rejects unfinished/%s turns", async (stop) => {
  setup(stop); const events: PartnerEvent[] = []; await streamChat(input, py, (e) => events.push(e));
  expect(events.at(-1)?.type).toBe("error");
});
it("rejects invented numeric answers", async () => {
  setup("end_turn", "The slope is 0.9."); const events: PartnerEvent[] = []; await streamChat(input, py, (e) => events.push(e));
  expect(events.at(-1)?.type).toBe("error");
});
it("does not start after cancellation", async () => {
  const runner = setup(); const abort = new AbortController(); abort.abort();
  await streamChat(input, py, () => {}, abort.signal); expect(runner).not.toHaveBeenCalled();
});
it("rejects tool calls from untrusted message bodies", () => {
  expect(() => chatInputSchema.parse({ ...input, messages: [{ role: "user", content: "hello", tool_calls: [{ name: "anything" }] }] })).toThrow();
  expect(() => chatInputSchema.parse({ ...input, messages: Array.from({ length: 21 }, () => ({ role: "user", content: "hello" })) })).toThrow();
});
it("runs analyze_case and propose_case through the runner tools before answering", async () => {
  const fixture = (await import("@/api/_fixtures/analyze.json")).default;
  const variables = (await import("@/api/_fixtures/variables.json")).default;
  const regions = (await import("@/api/_fixtures/regions.json")).default;
  const backend = { GET: vi.fn(async (path: string) => ({ data: path.endsWith("regions") ? regions : variables })), POST: vi.fn(async () => ({ data: fixture })) };
  type Tools = ReturnType<typeof import("./tools")["makeTools"]>;
  vi.mocked(getClient).mockReturnValue({ beta: { messages: { toolRunner: ({ tools }: { tools: Tools }) => ({ async *[Symbol.asyncIterator]() {
    const input = { variable: "T2M", regions: ["US-WI"], from: 2002, to: 2025, season: "JJA" };
    for (const [name, value] of [["analyze_case", input], ["propose_case", { ...input, title: "Wisconsin in summer" }]] as const) {
      const tool = tools.find((t) => t.name === name)!; await tool.run(tool.parse(value));
    }
    yield { async *[Symbol.asyncIterator]() { yield { type: "content_block_delta", delta: { type: "text_delta", text: "Mann-Kendall p = 0.01." } }; }, finalMessage: async () => ({ stop_reason: "end_turn", content: [] }) };
  } }) } } } as unknown as Anthropic);
  const events: PartnerEvent[] = [];
  await streamChat(input, backend as unknown as ReturnType<typeof serverApi>, (e) => events.push(e));
  expect(backend.POST).toHaveBeenCalledWith("/api/py/analyze", expect.objectContaining({ body: expect.objectContaining({ regions: ["US-WI"], season: "JJA" }) }));
  expect(events.some((e) => e.type === "propose_case")).toBe(true);
  expect(events.some((e) => e.type === "error")).toBe(false);
});
