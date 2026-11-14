import Anthropic from "@anthropic-ai/sdk";
export const MODEL = "claude-sonnet-5-5";
export const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } as const;
let client: Anthropic | undefined;
export function getClient(): Anthropic {
  if (typeof window !== "undefined") throw new Error("Server only");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Partner unavailable");
  return client ??= new Anthropic({ maxRetries: 0, timeout: 45_000 });
}
