"use client";
// Multivariable comparison: one radar axis per variable, one shape per region.
// It needs at least two regions and three variables; it runs only when the user
// presses Compare, like Investigate.
import { useState } from "react";
import { api } from "@/lib/api/client";
import type { Region, RegionAnalysis, Variable } from "@/lib/api/types";
import type { CaseState } from "@/lib/state/case-codec";
import { caseCopy, variableLabel } from "@/lib/copy/case";
import { fmtSlope } from "@/lib/partner/format";
import { displayUnit } from "@/components/globe/palette";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { clampPeriod } from "./controls";
import { MAX_VARIABLES, MIN_REGIONS, MIN_VARIABLES, cellFor, pointFor, radiusFor, scaleLimit, wrapLabel, type Cell } from "./multivariable";

type Props = { state: CaseState; variables: Variable[]; regions: Record<string, Region>; caseResults?: RegionAnalysis[] };
type Grid = { variables: Variable[]; cells: Record<string, Record<string, Cell | null>> };

export function MultivariableComparison({ state, variables, regions, caseResults }: Props) {
  const c = caseCopy.multivariable;
  const overOcean = state.regions.some((id) => regions[id]?.type === "ocean");
  const usable = variables.filter((v) => !(overOcean && v.land_only));
  const [picked, setPicked] = useState<string[]>(() => [state.variable]);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const enoughRegions = state.regions.length >= MIN_REGIONS;
  const ready = enoughRegions && picked.length >= MIN_VARIABLES && status !== "loading";

  async function compare() {
    setStatus("loading");
    const chosen = picked.map((id) => usable.find((v) => v.id === id)).filter((v): v is Variable => !!v);
    try {
      const signal = AbortSignal.timeout(60_000);
      const results = await Promise.all(chosen.map(async (v) => {
        if (v.id === state.variable && caseResults?.length) return caseResults;
        const period = clampPeriod(state.from, state.to, v);
        const { data, error } = await api.POST("/api/py/analyze", {
          body: { variable: v.id, regions: state.regions, start: period.from, end: period.to, season: state.season, months: state.months },
          signal,
        });
        if (error || !data) throw new Error("analysis unavailable");
        return data.results;
      }));
      const cells: Grid["cells"] = {};
      chosen.forEach((v, i) => {
        cells[v.id] = Object.fromEntries(state.regions.map((id) => [id, cellFor(results[i].find((r) => r.region.id === id))]));
      });
      setGrid({ variables: chosen, cells });
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section aria-label={c.title} className="space-y-3 border-t border-hairline pt-4 text-panel">
      <h3 className="label-mono">{c.title}</h3>
      {!enoughRegions ? <p className="text-scale text-ink-2">{c.needRegions}</p> : <>
        <p className="text-scale text-ink-2">{c.hint}</p>
        <fieldset>
          <legend className="mb-2 text-scale">{c.pick} <span className="font-mono text-ink-3">{picked.length}/{MAX_VARIABLES}</span></legend>
          <ToggleGroup type="multiple" variant="outline" size="sm" value={picked} className="flex flex-wrap justify-start gap-1.5"
            onValueChange={(next) => setPicked(next.slice(0, MAX_VARIABLES))}>
            {usable.map((v) => (
              <ToggleGroupItem key={v.id} value={v.id} disabled={!picked.includes(v.id) && picked.length >= MAX_VARIABLES}
                className="h-auto px-2 py-1 text-[0.72rem] normal-case tracking-normal">{shortName(v)}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </fieldset>
        <Button variant="outline" className="w-full" disabled={!ready} onClick={compare}>
          {status === "loading" ? c.running : c.run}
        </Button>
        {picked.length < MIN_VARIABLES && <p className="text-scale text-ink-2">{c.needVariables}</p>}
        {status === "error" && <div role="alert" className="text-scale"><p>{c.error}</p></div>}
        {grid && <Radar grid={grid} regionIds={state.regions} regions={regions} />}
      </>}
    </section>
  );
}

const shortName = (v: Variable) => variableLabel(v).replace(/\s*\([^)]*\)\s*$/, "");

const SIZE = { w: 420, h: 300, cx: 210, cy: 148, rim: 96 };

function Radar({ grid, regionIds, regions }: { grid: Grid; regionIds: string[]; regions: Record<string, Region> }) {
  const c = caseCopy.multivariable;
  const n = grid.variables.length;
  const limit = scaleLimit(grid.variables.flatMap((v) => regionIds.map((id) => grid.cells[v.id][id]?.score ?? null)));
  const { cx, cy, rim } = SIZE;
  const ring = (score: number) => grid.variables.map((_, i) => pointFor(i, n, radiusFor(score, limit, rim), cx, cy).join(",")).join(" ");
  const name = (id: string) => regions[id]?.name ?? id;
  return (
    <div className="space-y-2">
      <figure className="m-0">
        <svg viewBox={`0 0 ${SIZE.w} ${SIZE.h}`} role="img" aria-label={c.chartLabel} className="block w-full">
          {[-limit, -limit / 2, limit / 2, limit].map((s) => (
            <polygon key={s} points={ring(s)} fill="none" stroke="var(--hairline)" strokeWidth={1} />
          ))}
          <polygon points={ring(0)} fill="none" stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="3 3" />
          {grid.variables.map((v, i) => {
            const [x, y] = pointFor(i, n, rim, cx, cy);
            const [lx, ly] = pointFor(i, n, rim + 14, cx, cy);
            const anchor = Math.abs(lx - cx) < 4 ? "middle" : lx > cx ? "start" : "end";
            const lines = wrapLabel(shortName(v), 12);
            const top = ly < cy - 4 ? ly - (lines.length - 1) * 11 : ly + 4;
            return (
              <g key={v.id}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--hairline)" strokeWidth={1} />
                <text x={lx} y={top} textAnchor={anchor} className="fill-ink-2 font-mono" fontSize={9.5}>
                  {lines.map((line, k) => <tspan key={k} x={lx} dy={k ? 11 : 0}>{line}</tspan>)}
                </text>
              </g>
            );
          })}
          <text x={cx + 4} y={cy - radiusFor(0, limit, rim) - 3} className="fill-ink-3 font-mono" fontSize={8.5}>{c.noChange}</text>
          <text x={cx + 4} y={cy - rim - 3} className="fill-ink-3 font-mono" fontSize={8.5}>+{limit}</text>
          {regionIds.map((id, k) => {
            const pts = grid.variables.map((v, i) => {
              const cell = grid.cells[v.id][id];
              return cell?.score == null ? null : { v, cell, xy: pointFor(i, n, radiusFor(cell.score, limit, rim), cx, cy) };
            });
            const drawn = pts.filter((p): p is NonNullable<typeof p> => !!p);
            const pen = `var(--series-${k + 1})`;
            return (
              <g key={id}>
                {drawn.length >= 3 && <polygon points={drawn.map((p) => p.xy.join(",")).join(" ")} fill={pen} fillOpacity={0.1} stroke={pen} strokeWidth={2} strokeLinejoin="round" />}
                {drawn.map(({ v, cell, xy: [x, y] }) => (
                  <circle key={v.id} cx={x} cy={y} r={4} fill={cell.tier === "confirmed" ? pen : "var(--space)"} stroke={pen} strokeWidth={2}>
                    <title>{`${name(id)} · ${shortName(v)}: ${fmtSlope(cell.perDecade ?? NaN)} ${displayUnit(v.unit)}/decade (${fmtSlope(cell.score!)}× noise) · ${caseCopy.tiers[cell.tier]}`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
        <figcaption className="text-scale text-ink-2">{c.scale}</figcaption>
      </figure>
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-scale" aria-label={c.legend}>
        {regionIds.map((id, k) => (
          <li key={id} className="flex items-center gap-1.5"><span aria-hidden className="inline-block size-2.5 rounded-full" style={{ background: `var(--series-${k + 1})` }} />{name(id)}</li>
        ))}
        <li className="text-ink-3">{c.markers}</li>
      </ul>
      <details className="text-scale">
        <summary className="cursor-pointer text-ink-2">{c.table}</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr><th className="p-1.5 font-normal text-ink-3">{c.variable}</th>{regionIds.map((id) => <th key={id} className="p-1.5 font-normal text-ink-3">{name(id)}</th>)}</tr></thead>
            <tbody>{grid.variables.map((v) => (
              <tr key={v.id} className="border-t border-hairline">
                <th scope="row" className="p-1.5 font-normal">{shortName(v)}</th>
                {regionIds.map((id) => {
                  const cell = grid.cells[v.id][id];
                  return <td key={id} className="p-1.5">{cell?.score == null ? c.tooShort : <>
                    <span className="font-mono">{fmtSlope(cell.perDecade ?? NaN)} {displayUnit(v.unit)}</span>
                    <span className="block text-ink-3">{caseCopy.tiers[cell.tier]}</span></>}</td>;
                })}
              </tr>
            ))}</tbody>
          </table>
          <p className="mt-1 text-ink-3">{c.tableNote}</p>
        </div>
      </details>
    </div>
  );
}
