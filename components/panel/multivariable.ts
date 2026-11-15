// Pure helpers for the multivariable comparison (radar chart). Tested without a DOM.
import type { RegionAnalysis } from "@/lib/api/types";

export const MIN_REGIONS = 2;
export const MIN_VARIABLES = 3;
export const MAX_VARIABLES = 6;

/** One region's value on one variable's axis. */
export type Cell = {
  /** Change per decade divided by the year-to-year noise around the trend; null when unavailable. */
  score: number | null;
  /** Change per decade in the variable's own unit. */
  perDecade: number | null;
  tier: RegionAnalysis["verdict"]["tier"];
};

/**
 * Change per decade measured in the series' own year-to-year noise (the residual
 * standard deviation the engine reports). It puts degrees, millimetres and metres
 * per second on one scale: 1 means the trend moves the value by one typical
 * year-to-year wobble every decade.
 */
export function cellFor(result: Pick<RegionAnalysis, "stats" | "verdict"> | undefined): Cell | null {
  if (!result) return null;
  const s = result.stats;
  const ok = !!s && result.verdict.tier !== "too_short" && Number.isFinite(s.change_per_decade) && Number.isFinite(s.resid_sd) && s.resid_sd > 0;
  return { score: ok ? s!.change_per_decade / s!.resid_sd : null, perDecade: s && Number.isFinite(s.change_per_decade) ? s.change_per_decade : null, tier: result.verdict.tier };
}

const STEPS = [0.25, 0.5, 1, 2, 3, 5, 10];
/** A symmetric scale limit that holds every score, from a short list of round numbers. */
export function scaleLimit(scores: (number | null)[]): number {
  const max = Math.max(0, ...scores.filter((s): s is number => s !== null && Number.isFinite(s)).map(Math.abs));
  return STEPS.find((step) => max <= step) ?? Math.ceil(max);
}

/** Angle of axis i of n, starting at the top and going clockwise. */
export const axisAngle = (i: number, n: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;

/** Distance from the centre: −limit at the centre, 0 on the middle ring, +limit at the rim. */
export function radiusFor(score: number, limit: number, rim: number) {
  const clamped = Math.max(-limit, Math.min(limit, score));
  return (rim * (clamped + limit)) / (2 * limit);
}

export function pointFor(i: number, n: number, r: number, cx: number, cy: number): [number, number] {
  const a = axisAngle(i, n);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** Splits an axis label into at most two short lines. */
export function wrapLabel(text: string, width = 14): string[] {
  if (text.length <= width) return [text];
  const words = text.split(" ");
  const first: string[] = [];
  while (words.length && [...first, words[0]].join(" ").length <= width) first.push(words.shift()!);
  if (!first.length) first.push(words.shift()!);
  const rest = words.join(" ");
  return rest ? [first.join(" "), rest.length > width + 8 ? `${rest.slice(0, width + 6)}…` : rest] : [first.join(" ")];
}
