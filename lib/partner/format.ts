/** Display precision only: never use rounded values to decide a verdict. */
export function fmtSlope(x: number): string {
  return Number.isFinite(x) ? `${x > 0 ? "+" : ""}${x.toPrecision(2)}` : "—";
}
export function fmtP(p: number): string {
  return !Number.isFinite(p) || p < 0 || p > 1 ? "—" : p < 0.001 ? "< 0.001" : p.toPrecision(2);
}
export function fmtNumber(x: number): string {
  return Number.isFinite(x) ? x.toPrecision(3) : "—";
}
