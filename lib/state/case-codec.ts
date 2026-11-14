// Case state <-> URL codec. Pure and safe to import server-side (the partner route
// uses caseToQuery/normalizeCase for propose_case). SEAM: frozen after H2 —
// see docs/process/OWNERSHIP.md before changing any exported name or shape.

export const SEASONS = ["ANN", "DJF", "MAM", "JJA", "SON", "CUSTOM"] as const;
export type Season = (typeof SEASONS)[number];

export const READING_LEVELS = ["student", "scientist"] as const;
export type ReadingLevel = (typeof READING_LEVELS)[number];

export interface CaseState {
  variable: string;
  regions: string[];
  from: number;
  to: number;
  season: Season;
  /** Only for season "CUSTOM": contiguous months in cyclic order, e.g. [11, 12, 1]. */
  months: number[] | null;
  level: ReadingLevel;
}

export const MAX_REGIONS = 4;

export const DEFAULT_CASE: CaseState = {
  variable: "T2M",
  regions: [],
  from: 1981,
  to: 2025,
  season: "ANN",
  months: null,
  level: "student",
};

function isSeason(s: unknown): s is Season {
  return typeof s === "string" && (SEASONS as readonly string[]).includes(s);
}

function isLevel(s: unknown): s is ReadingLevel {
  return typeof s === "string" && (READING_LEVELS as readonly string[]).includes(s);
}

function toYear(n: unknown, fallback: number): number {
  const v = typeof n === "string" ? Number(n) : n;
  return typeof v === "number" && Number.isInteger(v) ? v : fallback;
}

/**
 * Months as a contiguous run in cyclic order, starting right after the single gap
 * around the 12-month circle. Returns null when the set isn't one contiguous run
 * (or is empty / all twelve months, which is just ANN).
 */
function cyclicRun(months: number[]): number[] | null {
  const set = [...new Set(months.filter((m) => Number.isInteger(m) && m >= 1 && m <= 12))].sort(
    (a, b) => a - b,
  );
  if (set.length === 0 || set.length === 12) return null;
  let gaps = 0;
  let startIndex = 0;
  for (let i = 0; i < set.length; i++) {
    const next = i + 1 < set.length ? set[i + 1] : set[0] + 12;
    if (next - set[i] > 1) {
      gaps++;
      startIndex = (i + 1) % set.length;
    }
  }
  if (gaps !== 1) return null;
  return [...set.slice(startIndex), ...set.slice(0, startIndex)];
}

export function normalizeCase(c: Partial<CaseState>): CaseState {
  const variable =
    typeof c.variable === "string" && c.variable.trim() ? c.variable.trim() : DEFAULT_CASE.variable;

  // Insertion order is kept (first occurrence wins): region i draws with pen
  // --series-(i+1) on the globe and in the charts, so adding a region must never
  // repaint the ones already chosen.
  const regions = [
    ...new Set((c.regions ?? []).map((r) => (typeof r === "string" ? r.trim() : "")).filter(Boolean)),
  ].slice(0, MAX_REGIONS);

  let from = toYear(c.from, DEFAULT_CASE.from);
  let to = toYear(c.to, DEFAULT_CASE.to);
  if (from > to) [from, to] = [to, from];

  let season: Season = isSeason(c.season) ? c.season : "ANN";
  let months: number[] | null = null;
  if (season === "CUSTOM") {
    months = cyclicRun(c.months ?? []);
    if (!months) season = "ANN";
  }

  const level: ReadingLevel = isLevel(c.level) ? c.level : DEFAULT_CASE.level;

  return { variable, regions, from, to, season, months, level };
}

function encode(v: string): string {
  return encodeURIComponent(v).replace(/%2C/gi, ",");
}

function query(c: CaseState, withLevel: boolean): string {
  const n = normalizeCase(c);
  const parts: [string, string][] = [["v", n.variable]];
  if (n.regions.length) parts.push(["r", n.regions.join(",")]);
  parts.push(["from", String(n.from)], ["to", String(n.to)], ["s", n.season]);
  if (n.season === "CUSTOM" && n.months) parts.push(["m", n.months.join(",")]);
  if (withLevel) parts.push(["lvl", n.level]);
  return parts.map(([k, v]) => `${k}=${encode(v)}`).join("&");
}

/** Query string (no leading "?") with keys in the fixed order v, r, from, to, s, m, lvl. */
export function caseToQuery(c: CaseState): string {
  return query(c, true);
}

/** Key for a case, ignoring the reading level (e.g. demo-explanations lookup). Region order is part of the case (pens follow it). */
export function caseKey(c: CaseState): string {
  return query(c, false);
}

export function caseFromQuery(q: string | URLSearchParams): CaseState {
  const p = typeof q === "string" ? new URLSearchParams(q) : q;
  const list = (key: string) => (p.get(key) ?? "").split(",");
  return normalizeCase({
    variable: p.get("v") ?? undefined,
    regions: p.has("r") ? list("r") : [],
    from: p.has("from") ? Number(p.get("from")) : undefined,
    to: p.has("to") ? Number(p.get("to")) : undefined,
    season: (p.get("s") ?? undefined) as Season | undefined,
    months: p.has("m") ? list("m").map(Number) : null,
    level: (p.get("lvl") ?? undefined) as ReadingLevel | undefined,
  });
}
