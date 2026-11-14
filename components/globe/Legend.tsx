"use client";

import { useMemo } from "react";
import { useVariables } from "@/components/panel/useVariables";
import { globeCopy } from "@/lib/copy/globe";
import { useCase } from "@/lib/state/use-case";
import { useUiStore } from "@/lib/state/ui-store";
import { UP_IS_WET, colorFor, domainFor, formatSlope, MUTE, type TrendRamp } from "./palette";
import { useTrendMap } from "./useTrendMap";

// CSS can read the ramp directly; the same order the palette uses (weak → strong).
const RAMP: TrendRamp = {
  up: ["var(--trend-up-1)", "var(--trend-up-2)", "var(--trend-up-3)"],
  down: ["var(--trend-down-1)", "var(--trend-down-2)", "var(--trend-down-3)"],
  neutral: "var(--trend-neutral)",
};

// What the globe colours mean: falling on the left, rising on the right, with
// the scale's ends in Fragment's figures and the unit per decade.
export function Legend() {
  const { state } = useCase();
  const { entries, loading, error } = useTrendMap(state);
  const variables = useVariables();
  const variable = variables.byId[state.variable];
  const hidden = useUiStore((s) => s.predictMode && !s.reveal);
  const domain = useMemo(() => domainFor(entries), [entries]);
  const upIsWet = UP_IS_WET.has(state.variable);

  // Seven steps from strongest fall to strongest rise, via the same rule the globe uses.
  const steps = useMemo(() => {
    const at = (fraction: number) => ({ slope_per_decade: fraction * domain, p: 0, q: 0, tier: "confirmed" as const });
    return [-1, -0.5, -0.17, 0, 0.17, 0.5, 1].map((f) => colorFor(at(f), domain, RAMP, { upIsWet }));
  }, [domain, upIsWet]);

  if (hidden) return null;
  if (error) return <p className="label-mono glass-pill rounded-full px-3 py-2">{globeCopy.trendUnavailable}</p>;
  if (loading) return <p className="label-mono glass-pill rounded-full px-3 py-2" role="status">{globeCopy.trendLoading}</p>;
  if (!entries || !Object.keys(entries).length) return null;

  const unit = variable?.unit ? `${variable.unit} / decade` : globeCopy.perDecade;
  return (
    <figure aria-label={globeCopy.legendLabel} className="glass-pill m-0 flex w-60 flex-col gap-2 rounded-xl px-3.5 py-3">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="label-mono">{globeCopy.legendTitle}</span>
        <span className="font-mono text-[0.7rem] text-ink-3">{unit}</span>
      </figcaption>
      <div aria-hidden className="grid h-2.5 grid-cols-7 gap-0.5 overflow-hidden rounded-sm">
        {steps.map((c, i) => <span key={i} style={{ background: c }} />)}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="figure text-base">{formatSlope(-domain)}</span>
        <span className="font-mono text-[0.7rem] text-ink-3">0</span>
        <span className="figure text-base">{formatSlope(domain)}</span>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-[0.72rem] text-ink-2">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm" style={{ background: "var(--trend-up-3)" }} />
          {globeCopy.legendSignificant}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm" style={{ background: mixColorVar("--trend-up-3") }} />
          {globeCopy.legendNotSignificant}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm border border-hairline-strong" style={{ background: "var(--globe-land)" }} />
          {globeCopy.legendNoData}
        </li>
      </ul>
    </figure>
  );
}

// The muted swatch, in CSS (the globe does the same mix in JS with mixHex).
function mixColorVar(token: string) {
  return `color-mix(in srgb, var(${token}) ${Math.round((1 - MUTE) * 100)}%, var(--trend-neutral))`;
}
