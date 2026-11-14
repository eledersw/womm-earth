// Trend-map colours, pure so they are tested without WebGL. three.js can't read
// CSS variables or color-mix(), so these work on resolved hex values.
import type { TrendMapEntry } from "@/lib/api/types";

/** Variables where "up" means wetter: their rises read blue, their falls warm. */
export const UP_IS_WET = new Set(["PRECTOTCORR", "PRECTOT", "GWETROOT", "GWETTOP", "GWETPROF", "RH2M", "QV2M"]);

/** Resolved ramp: index 0 = weakest step, 2 = strongest. */
export interface TrendRamp {
  up: readonly [string, string, string];
  down: readonly [string, string, string];
  neutral: string;
}

/** How far a non-significant trend is pulled toward neutral. */
export const MUTE = 0.6;
/** False-discovery-rate threshold for "significant" on the map. */
export const SIGNIFICANT_Q = 0.05;

/** Colour scale half-width: the 95th percentile of |slope per decade|, so one outlier can't wash the map out. */
export function domainFor(entries: Record<string, TrendMapEntry> | null | undefined): number {
  const xs = Object.values(entries ?? {})
    .map((e) => Math.abs(e.slope_per_decade))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (!xs.length) return 1e-6;
  const i = Math.min(xs.length - 1, Math.max(0, Math.ceil(0.95 * xs.length) - 1));
  return Math.max(xs[i], 1e-6);
}

/** 0, 1 or 2: which third of the domain |slope| falls in (clipped at the domain). */
export function stepFor(slope: number, domain: number): 0 | 1 | 2 {
  const r = Math.min(Math.abs(slope) / domain, 1);
  return r < 1 / 3 ? 0 : r < 2 / 3 ? 1 : 2;
}

export function colorFor(
  entry: TrendMapEntry | undefined,
  domain: number,
  ramp: TrendRamp,
  { upIsWet = false, hidden = false }: { upIsWet?: boolean; hidden?: boolean } = {},
): string {
  if (hidden || !entry || entry.tier === "too_short") return ramp.neutral;
  const slope = entry.slope_per_decade;
  if (!Number.isFinite(slope) || slope === 0) return ramp.neutral;
  const warm = upIsWet ? slope < 0 : slope > 0;
  const color = (warm ? ramp.up : ramp.down)[stepFor(slope, domain)];
  return entry.q < SIGNIFICANT_Q ? color : mixHex(color, ramp.neutral, MUTE);
}

/** "+0.80" / "−0.012": signed, two significant figures, real minus sign. */
export function formatSlope(v: number): string {
  if (!Number.isFinite(v)) return "n/a";
  const s = Math.abs(v) >= 100 ? Math.abs(v).toFixed(0) : Number(Math.abs(v).toPrecision(2)).toString();
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${s}`;
}

/** a → b by t (0..1), in sRGB. Accepts #rgb or #rrggbb. */
export function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const out = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function parseHex(hex: string): [number, number, number] | null {
  const h = hex.trim().replace(/^#/, "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}
