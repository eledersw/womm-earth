import { chatInputSchema } from "@/lib/partner/chat-input";
import { streamChat } from "@/lib/partner/chat";
import { serverApi } from "@/lib/api/client";
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
    const payload: unknown = JSON.parse(body);
    if (payload && typeof payload === "object" && "mode" in payload && payload.mode === "chat") {
      const input = chatInputSchema.parse(payload);
      const py = serverApi(new URL(request.url).origin, process.env.VERCEL_AUTOMATION_BYPASS_SECRET ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET } : {});
      return sseStream((emit, signal) => streamChat(input, py, emit, signal), { signal: request.signal });
    }
    const input = explainInputSchema.parse(payload);
    return sseStream((emit, signal) => streamExplain(input, emit, signal), { signal: request.signal });
  } catch {
    return sseStream(async (emit) => { emit({ type: "error", message: partnerCopy.invalid }); });
  }
}
