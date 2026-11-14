"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { AnalyzeResponse } from "@/lib/api/types";
import { caseKey, caseFromQuery, type CaseState } from "@/lib/state/case-codec";
import { caseCopy } from "@/lib/copy/case";

// Cache completed results only. In-flight requests belong to their effect and
// must never outlive it. Keep the session cache bounded.
const cache = new Map<string, AnalyzeResponse>();
type Snapshot = { key: string; data: AnalyzeResponse | null; error: string | null };

export function useAnalysis(state: CaseState, enabled = true) {
  const key = caseKey(state);
  const active = enabled && state.regions.length > 0;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => { cache.delete(key); setSnapshot(null); setAttempt((n) => n + 1); }, [key]);

  useEffect(() => {
    if (!active || cache.has(key)) return;
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
        cache.set(key, result);
        if (cache.size > 32) cache.delete(cache.keys().next().value!);
        setSnapshot({ key, data: result, error: null });
      } catch {
        if (!controller.signal.aborted) setSnapshot({ key, data: null, error: caseCopy.error });
      }
    })();
    return () => controller.abort();
  }, [key, active, attempt]);

  const current = active ? cache.get(key) ?? (snapshot?.key === key ? snapshot.data : null) : null;
  const error = active && snapshot?.key === key ? snapshot.error : null;
  return { data: current ?? null, error, loading: active && !current && !error, retry };
}
