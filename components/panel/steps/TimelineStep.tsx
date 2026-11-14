"use client";
import { useId, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import type { Variable } from "@/lib/api/types";
import { SEASONS, type Season } from "@/lib/state/case-codec";
import { caseCopy } from "@/lib/copy/case";
import { clampPeriod, contiguousMonths, type CaseControls } from "../controls";
import { StepSection, type StepProps } from "./StepSection";

export function TimelineStep({ state, setCase, variable, onCalculate, calculateDisabled, calculating, ...status }: StepProps & CaseControls & {
  variable?: Variable;
  onCalculate: () => void;
  calculateDisabled: boolean;
  calculating: boolean;
}) {
  return <StepSection step="timeline" {...status}>
    {variable ? <>
      <TimelineControls key={`${variable.id}:${state.from}:${state.to}`} state={state} setCase={setCase} variable={variable} />
      <div className="mt-4 flex justify-end">
        <Button onClick={onCalculate} disabled={calculateDisabled}>
          {calculating ? caseCopy.controls.calculating : caseCopy.controls.calculate}
        </Button>
      </div>
    </>
      : <p className="text-sm text-muted-foreground">{caseCopy.steps.timeline.empty}</p>}
  </StepSection>;
}

function TimelineControls({ state, setCase, variable }: CaseControls & { variable: Variable }) {
  const id = useId();
  const bounds = clampPeriod(state.from, state.to, variable);
  // Local state is only the uncommitted slider gesture. The URL owns the case.
  const [draft, setDraft] = useState([bounds.from, bounds.to]);
  const startMonth = state.months?.[0] ?? 6;
  const endMonth = state.months?.at(-1) ?? 8;
  const monthSelect = (label: string, value: number, change: (value: number) => void) => <label className="text-sm">
    {label}<select className="mt-1 block rounded-md border bg-background p-2" value={value} onChange={(e) => change(Number(e.target.value))}>
      {caseCopy.controls.months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
    </select>
  </label>;
  return <div className="space-y-4">
    <div>
      <p id={id} className="mb-3 text-sm font-medium">{caseCopy.controls.period}: {draft[0]}–{draft[1]}</p>
      <Slider aria-labelledby={id} min={variable.start_year} max={variable.end_year} step={1} value={draft}
        disabled={variable.start_year === variable.end_year} onValueChange={setDraft}
        onValueCommit={([from, to]) => setCase({ from, to })} />
    </div>
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{caseCopy.controls.season}</legend>
      <ToggleGroup type="single" variant="outline" value={state.season} className="flex flex-wrap justify-start" onValueChange={(value) => {
        if (SEASONS.includes(value as Season)) setCase({ season: value as Season, months: value === "CUSTOM" ? contiguousMonths(startMonth, endMonth) : null });
      }}>
        {SEASONS.map((season) => <ToggleGroupItem key={season} value={season}>{caseCopy.controls.seasons[season]}</ToggleGroupItem>)}
      </ToggleGroup>
    </fieldset>
    {state.season === "CUSTOM" && <div className="flex flex-wrap gap-4">
      {monthSelect(caseCopy.controls.startMonth, startMonth, (month) => setCase({ months: contiguousMonths(month, endMonth) }))}
      {monthSelect(caseCopy.controls.endMonth, endMonth, (month) => setCase({ months: contiguousMonths(startMonth, month) }))}
    </div>}
  </div>;
}
