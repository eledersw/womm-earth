import { partnerCopy } from "@/lib/copy/partner";
import { MAX_EVENT_BYTES, partnerEventSchema, type PartnerEvent } from "./events";

export async function readSse(
  response: Response,
  onEvent: (event: PartnerEvent) => void,
  { signal, timeoutMs = 120_000 }: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<void> {
  if (!response.ok || !/^text\/event-stream(?:;|$)/i.test(response.headers.get("content-type") ?? "") || !response.body) {
    await response.body?.cancel();
    throw new Error(partnerCopy.streamError);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const encoder = new TextEncoder();
  let buffer = "";
  let data: string[] = [];
  let eventSize = 0;
  let done = false;
  let timedOut = false;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  const timer = setTimeout(() => { timedOut = true; cancel(); }, timeoutMs);
  signal?.addEventListener("abort", cancel, { once: true });
  const checkCancelled = () => {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (timedOut) throw new Error(partnerCopy.timeout);
  };
  const line = (value: string) => {
    eventSize += encoder.encode(value).byteLength + 1;
    if (eventSize > MAX_EVENT_BYTES) throw new Error(partnerCopy.streamError);
    if (value === "") {
      if (data.length) {
        let event: PartnerEvent;
        try { event = partnerEventSchema.parse(JSON.parse(data.join("\n"))); }
        catch { throw new Error(partnerCopy.streamError); }
        checkCancelled();
        onEvent(event);
        done = event.type === "done";
      }
      data = [];
      eventSize = 0;
    } else if (value.startsWith("data:")) {
      data.push(value.slice(5).replace(/^ /, ""));
    }
    // Comment, event, id and retry fields are not part of our event payload.
  };

  try {
    checkCancelled();
    while (!done) {
      const chunk = await reader.read();
      checkCancelled();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done });
      let end: number;
      while (!done && (end = buffer.search(/[\r\n]/)) !== -1) {
        // A CRLF delimiter may be split across byte chunks.
        if (buffer[end] === "\r" && end === buffer.length - 1 && !chunk.done) break;
        const delimiter = buffer[end] === "\r" && buffer[end + 1] === "\n" ? 2 : 1;
        const next = buffer.slice(0, end);
        buffer = buffer.slice(end + delimiter);
        line(next);
      }
      if (buffer.length + eventSize > MAX_EVENT_BYTES) throw new Error(partnerCopy.streamError);
      if (chunk.done && !done) throw new Error(partnerCopy.streamError);
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
