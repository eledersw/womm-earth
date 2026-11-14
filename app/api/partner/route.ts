import { explainInputSchema } from "@/lib/partner/input";
import { streamExplain } from "@/lib/partner/explain";
import { sseStream } from "@/lib/partner/sse";
import { partnerCopy } from "@/lib/copy/partner";
export const maxDuration = 60;
const MAX_BYTES = 256 * 1024;
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) throw new Error("origin");
    if (!/^application\/json(?:;|$)/i.test(request.headers.get("content-type") ?? "")) throw new Error("content type");
    if (!request.body || Number(request.headers.get("content-length") ?? 0) > MAX_BYTES) throw new Error("size");
    const reader = request.body.getReader();
    let bytes = 0;
    let body = "";
    const decoder = new TextDecoder("utf-8", { fatal: true });
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > MAX_BYTES) throw new Error("size");
        body += decoder.decode(chunk.value, { stream: true });
      }
      body += decoder.decode();
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    const input = explainInputSchema.parse(JSON.parse(body));
    return sseStream((emit, signal) => streamExplain(input, emit, signal), { signal: request.signal });
  } catch {
    return sseStream(async (emit) => { emit({ type: "error", message: partnerCopy.invalid }); });
  }
}
