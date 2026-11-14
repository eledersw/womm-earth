"use client";
import { useId } from "react";
import type { Region, Variable } from "@/lib/api/types";
import { caseCopy } from "@/lib/copy/case";
import { availableHere, clampPeriod, type CaseControls } from "../controls";
import { StepSection, type StepProps } from "./StepSection";

type Props = StepProps & CaseControls & { variables: Variable[]; regions: Record<string, Region> };
export function LeadStep({ state, setCase, variables, regions, ...status }: Props) {
  const id = useId();
  const variable = variables.find((item) => item.id === state.variable);
  const available = variable && availableHere(variable.id, state.regions, regions);
  return <StepSection step="lead" {...status}>
    <label htmlFor={id} className="mb-2 block text-sm font-medium">{caseCopy.controls.variable}</label>
    <select id={id} className="w-full rounded-md border bg-background p-2" value={state.variable}
      onChange={(event) => {
        const next = variables.find((item) => item.id === event.target.value);
        if (next) setCase({ variable: next.id, ...clampPeriod(state.from, state.to, next) });
      }}>
      {!variable && <option value={state.variable} disabled>{state.variable}</option>}
      {(["satellite", "reanalysis"] as const).map((kind) => <optgroup key={kind} label={caseCopy.controls.kinds[kind]}>
        {variables.filter((item) => item.kind === kind).map((item) => {
          const valid = availableHere(item.id, state.regions, regions);
          return <option key={item.id} value={item.id} disabled={!valid}>
            {item.name} ({item.unit}){valid ? "" : ` — ${caseCopy.empty.notAvailableHere}`}
          </option>;
        })}
      </optgroup>)}
    </select>
    {!available && <p role="status" className="mt-2 text-sm">{caseCopy.empty.notAvailableHere}</p>}
    {variable && <div className="mt-3 space-y-1 text-sm">
      <p>{state.level === "scientist" ? variable.definition_scientist : variable.definition_student}</p>
      <p className="text-muted-foreground">{caseCopy.controls.source}: {variable.source} · {caseCopy.controls.kinds[variable.kind]} · {variable.start_year}–{variable.end_year}</p>
    </div>}
  </StepSection>;
}
