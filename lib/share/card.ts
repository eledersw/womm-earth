// The share card: what a Case's results look like as one picture (link previews and
// the PNG download). Pure, so the route stays a thin renderer and this is tested.
import { displayUnit } from "@/components/globe/palette";
import type { RegionAnalysis, Variable } from "@/lib/api/types";
import { caseCopy, variableLabel } from "@/lib/copy/case";
import { shareCopy } from "@/lib/copy/share";
import { fmtP, fmtSlope } from "@/lib/partner/format";
import { caseToQuery, type CaseState } from "@/lib/state/case-codec";

export type CardTier = RegionAnalysis["verdict"]["tier"];

export interface CardRow {
  name: string;
  /** 0-3: the region's pen, in Case order (same as the globe and charts). */
  pen: number;
  /** Null while the results are not in (the card then shows the Case only). */
  tier: CardTier | null;
  tierLabel: string;
  /** "+0.44 °C" (per decade, real minus sign), or "" when there is no estimate. */
  change: string;
  /** "MK p 0.012 · 21 years". */
  evidence: string;
  /** Yearly values for the sparkline (nulls are gaps). */
  values: (number | null)[];
}

export interface CardModel {
  title: string;
  subtitle: string;
  rows: CardRow[];
  ready: boolean;
}

export function seasonLabel(state: CaseState): string {
  return state.season === "CUSTOM" && state.months?.length
    ? state.months.map((m) => caseCopy.controls.months[m - 1]?.slice(0, 3) ?? "").join("–")
    : caseCopy.controls.seasons[state.season];
}

function unitFor(variable: Variable | undefined): string {
  if (!variable) return "";
  return variable.unit === "1" ? "" : displayUnit(variable.unit);
}

export function cardModel(
  state: CaseState,
  variable: Variable | undefined,
  results: RegionAnalysis[] | null,
  regionNames: Record<string, string> = {},
): CardModel {
  const title = variable ? variableLabel(variable) : state.variable;
  const subtitle = `${state.from}–${state.to} · ${seasonLabel(state)}`;
  const unit = unitFor(variable);
  if (!results) {
    return {
      title, subtitle, ready: false,
      rows: state.regions.map((id, pen) => ({
        name: regionNames[id] ?? id, pen, tier: null, tierLabel: shareCopy.card.pending, change: "", evidence: "", values: [],
      })),
    };
  }
  return {
    title, subtitle, ready: true,
    rows: results.map((r, pen) => {
      const s = r.stats;
      const estimate = s && Number.isFinite(s.change_per_decade) && r.verdict.tier !== "too_short";
      return {
        name: r.region.name,
        pen,
        tier: r.verdict.tier,
        tierLabel: caseCopy.tiers[r.verdict.tier],
        change: estimate ? `${fmtSlope(s.change_per_decade).replace("-", "−")}${unit ? ` ${unit}` : ""}` : "",
        evidence: s ? `${shareCopy.card.mk} ${fmtP(s.mk.p)} · ${s.n_years} ${shareCopy.card.years}` : "",
        values: r.yearly.map((y) => (y.value !== null && Number.isFinite(y.value) ? y.value : null)),
      };
    }),
  };
}

/** Sparkline points ("x,y x,y …") in a width × height box; gaps split the line. */
export function sparklines(values: (number | null)[], width: number, height: number, pad = 4): string[] {
  const finite = values.filter((v): v is number => v !== null);
  if (finite.length < 2) return [];
  const lo = Math.min(...finite);
  const hi = Math.max(...finite);
  const span = hi - lo || 1;
  const step = values.length > 1 ? (width - 2 * pad) / (values.length - 1) : 0;
  const runs: string[] = [];
  let run: string[] = [];
  values.forEach((v, i) => {
    if (v === null) {
      if (run.length > 1) runs.push(run.join(" "));
      run = [];
      return;
    }
    const x = pad + i * step;
    const y = pad + (1 - (v - lo) / span) * (height - 2 * pad);
    run.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  });
  if (run.length > 1) runs.push(run.join(" "));
  return runs;
}

/** Image URL for a Case's card (relative; same query as the Case link). */
export function cardPath(state: CaseState, { wait = false, download = false } = {}): string {
  const extra = [wait ? "wait=1" : "", download ? "download=1" : ""].filter(Boolean).join("&");
  return `/api/card?${caseToQuery(state)}${extra ? `&${extra}` : ""}`;
}

/** File name for the downloaded card: womm-earth-t2m-bel-nld-2000-2020.png */
export function cardFileName(state: CaseState): string {
  const slug = [state.variable, ...state.regions, String(state.from), String(state.to), state.season === "ANN" ? "" : state.season]
    .filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  return `womm-earth-${slug}.png`;
}
