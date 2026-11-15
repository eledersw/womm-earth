"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { TrendMapEntry } from "@/lib/api/types";
import type { CaseState } from "@/lib/state/case-codec";

export type TrendEntries = Record<string, TrendMapEntry>;

/** The trend map shows only when the API computes real entries. Until then
 * /api/py/trendmap serves a one-region fixture that contradicts real verdicts.
 * Set NEXT_PUBLIC_TRENDMAP_LIVE=1 (Vercel env) once the endpoint is real. */
export const TRENDMAP_LIVE = process.env.NEXT_PUBLIC_TRENDMAP_LIVE === "1";

type TrendQuery = Pick<CaseState, "variable" | "from" | "to" | "season" | "months">;

/** One trend map per variable, period and season (regions don't change it). */
export function trendMapKey(q: TrendQuery): string {
  const months = q.season === "CUSTOM" ? (q.months ?? []).join(",") : "";
  return [q.variable, q.from, q.to, q.season, months].join("|");
}

function queryFromKey(key: string) {
  const [variable, from, to, season, months] = key.split("|");
  return {
    variable,
    start: Number(from),
    end: Number(to),
    season: season as CaseState["season"],
    months: months ? months.split(",").map(Number) : undefined,
  };
}

// Shared by every caller (globe and legend): one request per key, kept for the visit.
const done = new Map<string, TrendEntries>();
const inflight = new Map<string, Promise<TrendEntries>>();

export function fetchTrendMap(key: string): Promise<TrendEntries> {
  const hit = done.get(key);
  if (hit) return Promise.resolve(hit);
  let p = inflight.get(key);
  if (!p) {
    p = (async () => {
      const { data, error } = await api.GET("/api/py/trendmap", { params: { query: queryFromKey(key) } });
      if (error || !data) throw new Error("trend map unavailable");
      done.set(key, data.entries);
      return data.entries;
    })().finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  return p;
}

export function useTrendMap(q: TrendQuery): { entries: TrendEntries | null; loading: boolean; error: boolean } {
  const key = trendMapKey(q);
  const [snap, setSnap] = useState<{ key: string; entries: TrendEntries | null; error: boolean } | null>(null);

  useEffect(() => {
    // Switched off: never ask the server (each call analyses every region on Earth).
    if (!TRENDMAP_LIVE || done.has(key)) return;
    let alive = true;
    fetchTrendMap(key).then(
      (entries) => alive && setSnap({ key, entries, error: false }),
      () => alive && setSnap({ key, entries: null, error: true }),
    );
    return () => {
      alive = false;
    };
  }, [key]);

  if (!TRENDMAP_LIVE) return { entries: null, loading: false, error: false };
  const entries = done.get(key) ?? (snap?.key === key ? snap.entries : null);
  const error = !entries && snap?.key === key && snap.error;
  return { entries, loading: !entries && !error, error };
}
