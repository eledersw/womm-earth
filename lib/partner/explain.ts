import Anthropic from "@anthropic-ai/sdk";
import { getClient, MODEL, FALLBACK } from "./anthropic";
import { EXPLAIN_SYSTEM, explainUserMessage } from "./prompts";
import { checkNumbers } from "./number-check";
import { summarizeAnalysis } from "./summarize";
import type { ExplainInput } from "./input";
import type { PartnerEvent } from "./events";
import { partnerCopy } from "@/lib/copy/partner";

// Matches EXPLAIN_SYSTEM (docs/science/VERDICT_TEMPLATES.md): a plain-language
// translation of the verdict, at most 3 short sentences and 60 words.
const MAX_EXPLANATION_WORDS = 60;
const MAX_EXPLANATION_SENTENCES = 3;
const MAX_SENTENCE_WORDS = 30;
// Statistical jargon the plain-language explanation must not use. Numbers are allowed
// (the change per decade) because checkNumbers verifies every one of them.
const JARGON = /\b(?:p[\s-]?values?|slopes?|confidence intervals?|Mann[–-]?Kendall|Sen(?:'s)?|OLS|AR\(1\)|autocorrelat\w*|regression|statistically|significan\w*|effective sample size|threshold|null hypothesis)\b/i;
// A sentence that followed a dropped one must not open mid-thought ("But …").
const LEADING_CONNECTIVE = /^(?:but|and|so|however|still|yet|also)\b,?\s+/i;

export function conciseExplanation(text: string, fallback: string): string {
  const sentences = [...new Intl.Segmenter("en", { granularity: "sentence" }).segment(text)]
    .map(({ segment }) => segment.trim())
    .filter((sentence) => sentence && !JARGON.test(sentence));
  const selected: string[] = [];
  let wordCount = 0;
  for (const sentence of sentences) {
    const words = sentence.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) ?? [];
    if (words.length > MAX_SENTENCE_WORDS || wordCount + words.length > MAX_EXPLANATION_WORDS) continue;
    selected.push(sentence);
    wordCount += words.length;
    if (selected.length === MAX_EXPLANATION_SENTENCES) break;
  }
  if (selected.length) {
    const first = selected[0].replace(LEADING_CONNECTIVE, "");
    selected[0] = first.charAt(0).toUpperCase() + first.slice(1);
  }
  return selected.join(" ") || fallback;
}

export async function streamExplain(input: ExplainInput, emit: (event: PartnerEvent) => void, signal?: AbortSignal): Promise<void> {
  if (input.analysis.verdict.tier === "too_short" || !input.analysis.stats) { emit({ type: "error", message: partnerCopy.offline }); return; }
  try {
    if (signal?.aborted) return;
    const stream = getClient().beta.messages.stream({
      model: MODEL, max_tokens: 512, ...FALLBACK, betas: [...FALLBACK.betas],
      thinking: { type: "adaptive" }, output_config: { effort: "low" },
      system: [{ type: "text", text: EXPLAIN_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: explainUserMessage(input) }],
    });
    const abort = () => stream.abort();
    signal?.addEventListener("abort", abort, { once: true });
    let text = "";
    try {
      for await (const event of stream) {
        if (signal?.aborted) return;
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          text += event.delta.text;
          if (text.length > 32_000) { stream.abort(); emit({ type: "error", message: partnerCopy.streamError }); return; }
        }
      }
      const final = await stream.finalMessage();
      if (signal?.aborted) return;
      // Safe operational metric only: never log input, output or credentials.
      console.info("partner.explain.cache_read_input_tokens", final.usage.cache_read_input_tokens ?? 0);
      if (final.stop_reason === "refusal") emit({ type: "error", message: partnerCopy.refused });
      else if (final.stop_reason !== "end_turn" || !text.trim()) emit({ type: "error", message: partnerCopy.streamError });
      else {
        const summary = summarizeAnalysis(input.analysis, input.variable, input.regionName, input.period, input.seasonLabel);
        const answer = conciseExplanation(text, "The available data describe a pattern but do not identify its physical cause.");
        if (!checkNumbers(text, [summary]).ok || !checkNumbers(answer, [summary]).ok) emit({ type: "error", message: partnerCopy.grounding });
        else emit({ type: "text", text: answer });
      }
    } finally { signal?.removeEventListener("abort", abort); }
  } catch (error) {
    if (signal?.aborted) return;
    if (error instanceof Anthropic.RateLimitError) emit({ type: "error", message: partnerCopy.busy });
    else if (error instanceof Anthropic.APIError) emit({ type: "error", message: partnerCopy.offline });
    else emit({ type: "error", message: partnerCopy.offline });
  }
}
