// Stub created by Eleder in the scaffold; owned by Ekaitz from the first merge on
// (docs/process/OWNERSHIP.md).
// Note: cacheComponents is enabled in next.config.ts, so this file must NOT export
// `runtime` (Next 16 rejects it; Node.js is already the default).
export const maxDuration = 60;

export async function POST() {
  return Response.json({ error: "partner not implemented yet" }, { status: 501 });
}
