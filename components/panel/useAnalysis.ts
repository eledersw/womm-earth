"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { AnalyzeResponse } from "@/lib/api/types";
import { caseKey, caseFromQuery, type CaseState } from "@/lib/state/case-codec";
import { caseCopy } from "@/lib/copy/case";

type Snapshot = { key: string; data: AnalyzeResponse | null; error: string | null };

export function useAnalysis(state: CaseState, enabled = true) {
  const key = caseKey(state);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [submission, setSubmission] = useState<{ key: string; request: number } | null>(null);
  const calculate = useCallback(() => {
    setSnapshot(null);
    setSubmission((previous) => ({ key, request: (previous?.request ?? 0) + 1 }));
  }, [key]);
  const active = enabled && state.regions.length > 0 && submission?.key === key;

  // Reset a submitted Case when its URL identity changes. This conditional
  // render adjustment prevents resubmitting it when navigating back and avoids
  // cascading updates from an effect. Calculation remains an explicit action.
  if (submission && submission.key !== key) setSubmission(null);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const current = caseFromQuery(key);
    void (async () => {
      try {
        const { data, error } = await api.POST("/api/py/analyze", {
          body: {
            variable: current.variable, regions: current.regions,
            start: current.from, end: current.to, season: current.season, months: current.months,
          },
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (error || !data) throw new Error("analysis unavailable");
        const result = data as AnalyzeResponse; // Restore generated fixed-length geo tuples.
        setSnapshot({ key, data: result, error: null });
      } catch {
        if (!controller.signal.aborted) setSnapshot({ key, data: null, error: caseCopy.error });
      }
    })();
    return () => controller.abort();
  }, [key, active, submission?.request]);

  const current = active && snapshot?.key === key ? snapshot.data : null;
  const error = active && snapshot?.key === key ? snapshot.error : null;
  const loading = active && !current && !error;
  return { data: current ?? null, error, loading, calculate, retry: calculate };
}
