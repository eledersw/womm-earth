import { describe, expect, it, vi } from "vitest";
import { sseStream, type PartnerEvent } from "./sse";
import { readSse } from "./sse-client";

const encode = new TextEncoder();
function responseFor(text: string, split = 1) {
  const bytes = encode.encode(text);
  return new Response(new ReadableStream({
    start(controller) {
      for (let index = 0; index < bytes.length; index += split) controller.enqueue(bytes.slice(index, index + split));
      controller.close();
    },
  }), { headers: { "Content-Type": "text/event-stream" } });
}

describe("partner SSE", () => {
  it("sse roundtrip preserves order and emits done exactly once", async () => {
    const input: PartnerEvent[] = [
      { type: "text", text: "Evidence… −0.04 °C" },
      { type: "tool_call", name: "analyze_case" },
      { type: "tool_result", name: "analyze_case", data: { p: 0.04 } },
      { type: "propose_case", query: "v=T2M", title: "A case" },
    ];
    const events: PartnerEvent[] = [];
    const response = sseStream(async (emit) => { input.forEach(emit); });
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");
    await readSse(response, (event) => events.push(event));
    expect(events).toEqual([...input, { type: "done" }]);
  });
  it("accepts one-byte chunks, UTF-8, comments, CRLF and multiline data", async () => {
    const events: PartnerEvent[] = [];
    await readSse(responseFor(': heartbeat\r\ndata: {"type":"text",\r\ndata: "text":"Aerosol −0.04 °C"}\r\n\r\ndata: {"type":"done"}\r\n\r\n'), (e) => events.push(e));
    expect(events).toEqual([{ type: "text", text: "Aerosol −0.04 °C" }, { type: "done" }]);
  });
  it("converts thrown exceptions to a safe error followed by done", async () => {
    const events: PartnerEvent[] = [];
    await readSse(sseStream(async () => { throw new Error("secret-internal-detail"); }), (e) => events.push(e));
    expect(events.map((e) => e.type)).toEqual(["error", "done"]);
    expect(JSON.stringify(events)).not.toContain("secret-internal-detail");
  });
  it("does not duplicate done or emit text after done", async () => {
    const events: PartnerEvent[] = [];
    await readSse(sseStream(async (emit) => {
      emit({ type: "done" }); emit({ type: "text", text: "late" });
    }), (e) => events.push(e));
    expect(events).toEqual([{ type: "done" }]);
  });
  it("rejects HTTP errors, wrong content types, invalid payloads and truncated streams", async () => {
    await expect(readSse(new Response("private", { status: 500 }), () => {})).rejects.toThrow();
    await expect(readSse(new Response("{}", { headers: { "content-type": "application/json" } }), () => {})).rejects.toThrow();
    await expect(readSse(responseFor('data: {"type":"text","text":42}\n\n'), () => {})).rejects.toThrow();
    await expect(readSse(responseFor('data: {"type":"text","text":"partial"}\n\n'), () => {})).rejects.toThrow();
    await expect(readSse(responseFor('data: {broken}\n\n'), () => {})).rejects.toThrow();
  });
  it("bounds event size", async () => {
    await expect(readSse(responseFor(`data: ${"x".repeat(300_000)}`, 32_768), () => {})).rejects.toThrow();
  });
  it("cancels the reader on abort and emits no stale events", async () => {
    const cancel = vi.fn();
    const abort = new AbortController();
    const onEvent = vi.fn();
    const res = new Response(new ReadableStream({ cancel }), { headers: { "content-type": "text/event-stream" } });
    const reading = readSse(res, onEvent, { signal: abort.signal });
    abort.abort();
    await expect(reading).rejects.toMatchObject({ name: "AbortError" });
    expect(cancel).toHaveBeenCalledOnce();
    expect(onEvent).not.toHaveBeenCalled();
    expect(res.body?.locked).toBe(false);
  });
  it("propagates browser disconnect to the producer", async () => {
    let producerSignal: AbortSignal | undefined;
    const response = sseStream(async (_emit, signal) => {
      producerSignal = signal;
      await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true }));
    });
    const reader = response.body!.getReader();
    await reader.cancel();
    expect(producerSignal?.aborted).toBe(true);
    reader.releaseLock();
  });
  it("times out an unresponsive producer and closes cleanly", async () => {
    const events: PartnerEvent[] = [];
    await readSse(sseStream(async () => { await new Promise(() => {}); }, { timeoutMs: 10 }), (e) => events.push(e));
    expect(events.map((e) => e.type)).toEqual(["error", "done"]);
  });
  it("releases the reader when the consumer throws", async () => {
    const res = responseFor('data: {"type":"text","text":"hi"}\n\ndata: {"type":"done"}\n\n');
    await expect(readSse(res, () => { throw new Error("consumer"); })).rejects.toThrow("consumer");
    expect(res.body?.locked).toBe(false);
  });
  it("handles pre-aborted requests without starting the producer", async () => {
    const abort = new AbortController();
    abort.abort();
    const producer = vi.fn(async () => {});
    const response = sseStream(producer, { signal: abort.signal });
    expect(await response.text()).toBe("");
    expect(producer).not.toHaveBeenCalled();
    const res = responseFor('data: {"type":"done"}\n\n');
    await expect(readSse(res, () => {}, { signal: abort.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(res.body?.locked).toBe(false);
  });
  it("times out a stalled reader and releases its lock", async () => {
    const cancel = vi.fn();
    const res = new Response(new ReadableStream({ cancel }), { headers: { "content-type": "text/event-stream" } });
    await expect(readSse(res, () => {}, { timeoutMs: 10 })).rejects.toThrow();
    expect(cancel).toHaveBeenCalledOnce();
    expect(res.body?.locked).toBe(false);
  });
  it("propagates a read failure and releases its lock", async () => {
    const res = new Response(new ReadableStream({
      pull(controller) { controller.error(new Error("network read failed")); },
    }), { headers: { "content-type": "text/event-stream" } });
    await expect(readSse(res, () => {})).rejects.toThrow("network read failed");
    expect(res.body?.locked).toBe(false);
  });
});
