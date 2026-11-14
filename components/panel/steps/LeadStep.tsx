"use client";
import { displayUnit } from "@/components/globe/palette";
import { useId, useState } from "react";
import type { Variable } from "@/lib/api/types";
import { caseCopy } from "@/lib/copy/case";
import { clampPeriod, type CaseControls } from "../controls";
import { StepSection, type StepProps } from "./StepSection";

type Props = StepProps & CaseControls & { variables: Variable[] };
export function LeadStep({ state, setCase, variables, ...status }: Props) {
  const id = useId();
  const searchId = useId();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matching = variables.filter((item) => !normalizedQuery || [
    item.id, item.name, item.unit, item.definition_student, item.definition_scientist, item.power_type ?? "",
  ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)));
  const variable = variables.find((item) => item.id === state.variable);
  return <StepSection step="lead" {...status}>
    <label htmlFor={searchId} className="mb-2 block text-sm font-medium">{caseCopy.controls.searchVariables}</label>
    <input id={searchId} type="search" className="mb-3 w-full rounded-md border bg-background p-2"
      placeholder={caseCopy.controls.searchVariables} value={query} onChange={(event) => setQuery(event.target.value)} />
    <label htmlFor={id} className="mb-2 block text-sm font-medium">{caseCopy.controls.variable}</label>
    <select id={id} className="w-full rounded-md border bg-background p-2" value={state.variable}
      onChange={(event) => {
        const next = variables.find((item) => item.id === event.target.value);
        if (next) setCase({ variable: next.id, ...clampPeriod(state.from, state.to, next) });
      }}>
      {!variable && <option value={state.variable} disabled>{state.variable}</option>}
      {(["satellite", "reanalysis"] as const).map((kind) => <optgroup key={kind} label={caseCopy.controls.kinds[kind]}>
        {matching.filter((item) => item.kind === kind).map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} [{item.id}] ({item.unit === "1" ? caseCopy.controls.dimensionless : displayUnit(item.unit)}){item.power_type ? ` — ${item.power_type}` : ""}
          </option>
        ))}
      </optgroup>)}
    </select>
    {matching.length === 0 && <p role="status" className="mt-2 text-sm">{caseCopy.controls.noVariableMatches}</p>}
    {variable && <div className="mt-3 space-y-1 text-sm">
      <p>{state.level === "scientist" ? variable.definition_scientist : variable.definition_student}</p>
      <p className="text-muted-foreground">{caseCopy.controls.source}: {variable.source} · {caseCopy.controls.kinds[variable.kind]} · {variable.start_year}–{variable.end_year}</p>
    </div>}
  </StepSection>;
}
