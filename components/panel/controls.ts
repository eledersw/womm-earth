import type { Region, Variable } from "@/lib/api/types";
import type { CaseState } from "@/lib/state/case-codec";

export type CaseControls = {
  state: CaseState;
  setCase: (patch: Partial<CaseState>) => void;
};

export function availableHere(variable: string, ids: string[], regions: Record<string, Region>) {
  return ids.every((id) => regions[id]?.valid_variables.includes(variable));
}

export function clampPeriod(from: number, to: number, variable: Variable) {
  const clamp = (year: number) => Math.max(variable.start_year, Math.min(variable.end_year, year));
  return { from: clamp(from), to: clamp(to) };
}

export function contiguousMonths(start: number, end: number) {
  return Array.from({ length: (end - start + 12) % 12 + 1 }, (_, i) => (start - 1 + i) % 12 + 1);
}
