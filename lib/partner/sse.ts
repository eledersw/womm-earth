import { partnerCopy } from "@/lib/copy/partner";
import { MAX_EVENT_BYTES, partnerEventSchema, type PartnerEvent } from "./events";

export type { PartnerEvent } from "./events";
type Emit = (event: PartnerEvent) => void;

export function sseStream(
  run: (emit: Emit, signal: AbortSignal) => Promise<void>,
  { signal, timeoutMs = 50_000 }: { signal?: AbortSignal; timeoutMs?: number } = {},
): Response {
  const abort = new AbortController();
  const encoder = new TextEncoder();
  let close: (cancelled?: boolean) => void = () => {};

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const onAbort = () => {
        abort.abort();
        close();
      };
      close = (cancelled = false) => {
        if (closed) return;
        closed = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        if (!cancelled) controller.close();
        abort.abort();
      };
      const emit: Emit = (input) => {
        if (closed) return;
        const event = partnerEventSchema.parse(input);
        const bytes = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
        if (bytes.byteLength > MAX_EVENT_BYTES) throw new Error("Partner event exceeds size limit");
        controller.enqueue(bytes);
        if (event.type === "done") close();
      };

      const timer = setTimeout(() => {
        emit({ type: "error", message: partnerCopy.timeout });
        emit({ type: "done" });
        abort.abort();
      }, timeoutMs);
      signal?.addEventListener("abort", onAbort, { once: true });
      if (signal?.aborted) { onAbort(); return; }

      // Do not return the producer's promise: cancellation must remain available
      // while a network call is pending. Producers receive the abort signal.
      void (async () => {
        try {
          await run(emit, abort.signal);
        } catch {
          emit({ type: "error", message: partnerCopy.streamError });
        } finally {
          emit({ type: "done" });
        }
      })();
    },
    cancel() {
      close(true);
      abort.abort();
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
