"use client";

// The single source of case state: the URL (via nuqs). SEAM: frozen after H2 —
// see docs/process/OWNERSHIP.md. Components that call useCase() must render inside
// a <Suspense> boundary (Next prerendering reads search params).
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
  type Values,
} from "nuqs";
import { useCallback, useMemo } from "react";
import {
  DEFAULT_CASE,
  READING_LEVELS,
  SEASONS,
  normalizeCase,
  type CaseState,
} from "./case-codec";

const parsers = {
  v: parseAsString.withDefault(DEFAULT_CASE.variable),
  r: parseAsArrayOf(parseAsString, ",").withDefault([]),
  from: parseAsInteger.withDefault(DEFAULT_CASE.from),
  to: parseAsInteger.withDefault(DEFAULT_CASE.to),
  s: parseAsStringLiteral(SEASONS).withDefault(DEFAULT_CASE.season),
  m: parseAsArrayOf(parseAsInteger, ","),
  lvl: parseAsStringLiteral(READING_LEVELS).withDefault(DEFAULT_CASE.level),
};

type Query = Values<typeof parsers>;

function fromQuery(q: Query): CaseState {
  return normalizeCase({
    variable: q.v,
    regions: q.r,
    from: q.from,
    to: q.to,
    season: q.s,
    months: q.m,
    level: q.lvl,
  });
}

function toQuery(c: CaseState) {
  const n = normalizeCase(c);
  return {
    v: n.variable,
    r: n.regions,
    from: n.from,
    to: n.to,
    s: n.season,
    m: n.months, // null removes ?m=
    lvl: n.level,
  };
}

export function useCase(): {
  state: CaseState;
  setCase: (patch: Partial<CaseState>) => void;
  replaceCase: (next: CaseState) => void;
} {
  const [query, setQuery] = useQueryStates(parsers, { history: "replace" });

  const state = useMemo(() => fromQuery(query), [query]);

  const setCase = useCallback(
    (patch: Partial<CaseState>) => {
      void setQuery((old) => toQuery({ ...fromQuery(old), ...patch }));
    },
    [setQuery],
  );

  const replaceCase = useCallback(
    (next: CaseState) => {
      void setQuery(toQuery(next));
    },
    [setQuery],
  );

  return { state, setCase, replaceCase };
}
