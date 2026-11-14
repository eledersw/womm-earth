import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import fixture from "@/api/_fixtures/analyze.json";
import variables from "@/api/_fixtures/variables.json";
import { explainInputSchema } from "./input";
import { streamExplain } from "./explain";
import { getClient } from "./anthropic";
import type { PartnerEvent } from "./events";
import { partnerCopy } from "@/lib/copy/partner";
vi.mock("./anthropic", () => ({ getClient: vi.fn(), MODEL: "claude-sonnet-5-5", FALLBACK: { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } }));
const input = explainInputSchema.parse({ mode: "explain", level: "student", analysis: fixture.results[0], variable: variables[0], regionName: "Wisconsin", period: "2002–2025", seasonLabel: "JJA" });
function mockStream(text = "Mann-Kendall detects a trend, p = 0.01.", stopReason = "end_turn") {
  const abort = vi.fn();
  const stream = vi.fn(() => ({
    async *[Symbol.asyncIterator]() { yield { type: "content_block_delta", delta: { type: "text_delta", text } }; },
    finalMessage: async () => ({ stop_reason: stopReason, usage: { cache_read_input_tokens: 1 } }), abort,
  }));
  vi.mocked(getClient).mockReturnValue({ beta: { messages: { stream } } } as unknown as Anthropic);
  return { stream, abort };
}
beforeEach(() => vi.spyOn(console, "info").mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());
it("streams text with the planned model, fallback, adaptive thinking and cached system", async () => {
  const { stream } = mockStream(); const events: PartnerEvent[] = [];
  await streamExplain(input, (e) => events.push(e));
  expect(events.map((e) => e.type)).toEqual(["text"]);
  expect(stream).toHaveBeenCalledWith(expect.objectContaining({ model: "claude-sonnet-5-5", max_tokens: 512, thinking: { type: "adaptive" }, fallbacks: "default", output_config: { effort: "low" }, system: [expect.objectContaining({ cache_control: { type: "ephemeral" } })] }));
  expect(console.info).toHaveBeenCalledWith("partner.explain.cache_read_input_tokens", 1);
});
it.each(["refusal", "max_tokens"])("flags a %s response instead of accepting partial text", async (reason) => {
  mockStream("Partial explanation.", reason); const events: PartnerEvent[] = [];
  await streamExplain(input, (e) => events.push(e));
  expect(events.at(-1)?.type).toBe("error");
});
it("flags unsupported numbers after streaming", async () => {
  mockStream("The slope is 98765.4321."); const events: PartnerEvent[] = [];
  await streamExplain(input, (e) => events.push(e));
  expect(events.at(-1)).toEqual({ type: "error", message: partnerCopy.grounding });
});
it("maps rate limits before generic API errors", async () => {
  vi.mocked(getClient).mockImplementation(() => { throw new Anthropic.RateLimitError(429, undefined, "private", new Headers()); });
  const events: PartnerEvent[] = []; await streamExplain(input, (e) => events.push(e));
  expect(events).toEqual([{ type: "error", message: partnerCopy.busy }]);
});
it("does not start a request after cancellation or for too-short series", async () => {
  const { stream } = mockStream(); const abort = new AbortController(); abort.abort();
  await streamExplain(input, () => {}, abort.signal);
  await streamExplain({ ...input, analysis: { ...input.analysis, stats: null, verdict: { tier: "too_short", years_needed: null, reason: null } } }, () => {});
  expect(stream).not.toHaveBeenCalled();
});
it("propagates cancellation during streaming to the SDK", async () => {
  const { abort } = mockStream(); const controller = new AbortController(); const events: PartnerEvent[] = [];
  await streamExplain(input, (event) => { events.push(event); controller.abort(); }, controller.signal);
  expect(abort).toHaveBeenCalledOnce();
  expect(events.map((e) => e.type)).toEqual(["text"]);
});
