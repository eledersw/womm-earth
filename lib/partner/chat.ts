import Anthropic from "@anthropic-ai/sdk";
import type { serverApi } from "@/lib/api/client";
import { partnerCopy } from "@/lib/copy/partner";
import { getClient, MODEL, FALLBACK } from "./anthropic";
import { CHAT_SYSTEM } from "./prompts";
import { makeTools } from "./tools";
import type { PartnerEvent } from "./events";
import type { ChatInput } from "./chat-input";
import { keepGroundedLines } from "./number-check";
import { caseToQuery, normalizeCase } from "@/lib/state/case-codec";
export async function streamChat(input: ChatInput, py: ReturnType<typeof serverApi>, emit: (e: PartnerEvent) => void, signal?: AbortSignal) {
  const abort = new AbortController();
  const combined = signal ? AbortSignal.any([signal, abort.signal]) : abort.signal;
  const results: unknown[] = [];
  const trackedEmit = (e: PartnerEvent) => { if (e.type === "tool_result") results.push(e.data); if (!combined.aborted) emit(e); };
  try {
    combined.throwIfAborted();
    const messages = input.messages.map((m) => ({ ...m }));
    const last = messages.at(-1)!;
    last.content = `Current Case (context only): ${caseToQuery(normalizeCase({ ...input.case, level: input.level }))}. Reading level: ${input.level}.\n${last.content}`;
    const runner = getClient().beta.messages.toolRunner({ model: MODEL, max_tokens: 16000, max_iterations: 6, stream: true,
      ...FALLBACK, betas: [...FALLBACK.betas], thinking: { type: "adaptive" }, output_config: { effort: "medium" },
      system: [{ type: "text", text: CHAT_SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: makeTools(py, trackedEmit, combined, input.level), messages,
    }, { signal: combined });
    let finalText = ""; let completed = false;
    for await (const messageStream of runner) {
      combined.throwIfAborted();
      for await (const event of messageStream) {
        combined.throwIfAborted();
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          finalText += event.delta.text;
          if (finalText.length > 32_000) { emit({ type: "error", message: partnerCopy.tooLong }); return; }
        }
      }
      const message = await messageStream.finalMessage();
      if (message.stop_reason === "refusal") { emit({ type: "error", message: partnerCopy.refused }); return; }
      if (message.stop_reason === "max_tokens") { emit({ type: "error", message: partnerCopy.tooLong }); return; }
      if (message.stop_reason === "end_turn") completed = true;
    }
    if (!completed || !finalText.trim()) { emit({ type: "error", message: partnerCopy.tooLong }); return; }
    const grounded = keepGroundedLines(finalText, results);
    if (!grounded) { emit({ type: "error", message: partnerCopy.grounding }); return; }
    trackedEmit({ type: "text", text: grounded });

  } catch (error) {
    if (signal?.aborted) return;
    if (error instanceof Anthropic.RateLimitError) emit({ type: "error", message: partnerCopy.busy });
    else if (error instanceof Anthropic.APIError) emit({ type: "error", message: partnerCopy.offline });
    else emit({ type: "error", message: partnerCopy.chatRetry });
  } finally { abort.abort(); }
}
