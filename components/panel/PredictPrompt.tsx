"use client";
import { useState } from "react";
import type { RegionAnalysis } from "@/lib/api/types";
import { useUiStore } from "@/lib/state/ui-store";
import { caseCopy } from "@/lib/copy/case";
import { Button } from "@/components/ui/button";
export function PredictPrompt({ results }: { results: RegionAnalysis[] }) {
  const c = caseCopy.explorations;
  const reveal = useUiStore((s) => s.reveal);
  const [guess, setGuess] = useState<string | null>(null);
  const answer = (value: string | null) => { setGuess(value); useUiStore.getState().setReveal(true); };
  if (!reveal) return <section aria-label={c.predictQuestion} className="space-y-3">
    <p>{c.predictQuestion}</p>
    <div className="flex flex-wrap gap-2">{[c.up, c.down, c.unclear].map((choice) => <Button key={choice} variant="outline" onClick={() => answer(choice)}>{choice}</Button>)}</div>
    <Button variant="ghost" onClick={() => answer(null)}>{c.skip}</Button>
  </section>;
  if (!guess) return <p className="text-scale">{c.noGuess}</p>;
  return <ul className="space-y-1 text-scale">{results.map((r) => {
    const direction = r.verdict.tier === "too_short" ? caseCopy.tiers.too_short : r.verdict.tier === "no_case" || !r.stats ? c.unclear : r.stats.change_per_decade > 0 ? c.up : r.stats.change_per_decade < 0 ? c.down : c.unclear;
    return <li key={r.region.id}>{r.region.name}: {c.guessed} {guess}; {c.dataSays} {direction} ({caseCopy.tiers[r.verdict.tier]}).</li>;
  })}</ul>;
}
