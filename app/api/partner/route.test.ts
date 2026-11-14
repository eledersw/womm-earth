import { afterEach, expect, it, vi } from "vitest";
import fixture from "@/api/_fixtures/analyze.json";
import variables from "@/api/_fixtures/variables.json";
import { POST } from "./route";
import { readSse } from "@/lib/partner/sse-client";
import type { PartnerEvent } from "@/lib/partner/events";
const body = { mode: "explain", level: "student", analysis: fixture.results[0], variable: variables[0], regionName: "Wisconsin", period: "2002–2025", seasonLabel: "JJA" };
afterEach(() => vi.unstubAllEnvs());
it("explain route returns error event without key", async () => {
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  const res = await POST(new Request("http://localhost/api/partner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
  const events: PartnerEvent[] = []; await readSse(res, (e) => events.push(e));
  expect(events.map((e) => e.type)).toEqual(["error", "done"]);
});
it.each([
  { ...body, level: "invalid" }, { ...body, regionName: "Another region" }, { mode: "chat" },
  { ...body, analysis: { ...body.analysis, stats: { ...body.analysis.stats, mk: { ...body.analysis.stats.mk, p: -1 } } } },
])( "rejects malformed or unsupported payloads without a model call", async (payload) => {
  const res = await POST(new Request("http://localhost/api/partner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }));
  const events: PartnerEvent[] = []; await readSse(res, (e) => events.push(e));
  expect(events.map((e) => e.type)).toEqual(["error", "done"]);
});
it("rejects oversized and cross-origin requests", async () => {
  for (const options of ([{ "content-length": "999999" }, { origin: "https://untrusted.example" }] as Record<string, string>[])) {
    const res = await POST(new Request("http://localhost/api/partner", { method: "POST", headers: { "content-type": "application/json", ...options }, body: JSON.stringify(body) }));
    const events: PartnerEvent[] = []; await readSse(res, (e) => events.push(e));
    expect(events.map((e) => e.type)).toEqual(["error", "done"]);
  }
});
it("chat route also fails safely without a server key", async () => {
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  const { DEFAULT_CASE } = await import("@/lib/state/case-codec");
  const res = await POST(new Request("http://localhost/api/partner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "chat", level: "student", case: DEFAULT_CASE, messages: [{ role: "user", content: "What can I investigate?" }] }) }));
  const events: PartnerEvent[] = []; await readSse(res, (e) => events.push(e));
  expect(events.map((e) => e.type)).toEqual(["error", "done"]);
});
