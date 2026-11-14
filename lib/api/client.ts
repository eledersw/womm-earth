// Typed client for the Python API (/api/py/*), generated from Oier's contract.
// SEAM: frozen after H2 — see docs/process/OWNERSHIP.md.
import createClient from "openapi-fetch";
import type { paths } from "@/lib/api-types";

/** Browser client: relative URLs, same origin as the page. */
export const api = createClient<paths>({ baseUrl: "" });

/**
 * Server-side client (route handlers, scripts): needs an absolute origin.
 * On protected Vercel previews pass `{ "x-vercel-protection-bypass": secret }`.
 */
export function serverApi(origin: string, headers: Record<string, string> = {}) {
  return createClient<paths>({ baseUrl: origin, headers });
}
