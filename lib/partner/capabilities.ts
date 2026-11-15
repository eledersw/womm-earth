// /api/py/correlate still serves api/_fixtures/correlate.json. Enable only
// after Oier delivers requested-Case results and Methods reviews the evidence.
export const LIVE_CORRELATION_AVAILABLE = false;
export const correlationUnavailable = {
  available: false,
  reason: "Live correlation is unavailable. No correlation was calculated for the requested Case. Investigate each variable separately instead.",
} as const;
