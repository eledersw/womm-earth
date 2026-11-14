"use client";
import { useCallback, useEffect, useState } from "react";
import { caseCopy } from "@/lib/copy/case";
export function useCaseResource<T>(key: string, load: (signal: AbortSignal) => Promise<T>, enabled = true) {
  const [attempt, setAttempt] = useState(0);
  const identity = `${key}:${attempt}`;
  const [snapshot, setSnapshot] = useState<{ key: string; data: T | null; error: boolean } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]);
    void Promise.resolve().then(() => { if (controller.signal.aborted) return; return load(signal).then(
      (data) => { if (!controller.signal.aborted) setSnapshot({ key: identity, data, error: false }); },
      () => { if (!controller.signal.aborted) setSnapshot({ key: identity, data: null, error: true }); },
    ); });
    return () => controller.abort();
  }, [identity, enabled, load]);
  const current = enabled && snapshot?.key === identity ? snapshot : null;
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { data: current?.data ?? null, loading: enabled && !current, error: current?.error ? caseCopy.error : null, retry };
}
