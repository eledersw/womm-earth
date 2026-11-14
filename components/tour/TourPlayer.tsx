"use client";
import { useEffect, useRef, useState } from "react";
import type { Tour } from "@/lib/tour/types";
import type { Region } from "@/lib/api/types";
import { caseFromQuery, caseToQuery } from "@/lib/state/case-codec";
import { useCase } from "@/lib/state/use-case";
import { useUiStore } from "@/lib/state/ui-store";
import { regionLatLng } from "@/lib/api/region-geo";
import { tourCopy as c } from "@/lib/copy/tour";
import { Button } from "@/components/ui/button";

export function TourPlayer({ tour, regions, onExit }: { tour: Tour; regions: Record<string, Region>; onExit: () => void }) {
  const { state, replaceCase } = useCase();
  const [snapshot] = useState(() => ({ state, focus: useUiStore.getState().focus, predictMode: useUiStore.getState().predictMode, reveal: useUiStore.getState().reveal }));
  const [{ index, playing }, setPlayback] = useState({ index: 0, playing: false });
  const step = tour.steps[index];
  const { query, reveal } = step;
  const region = regions[caseFromQuery(query).regions[0]];
  const lat = step.focus?.lat; const lng = step.focus?.lng; const altitude = step.focus?.altitude;
  const highlight = JSON.stringify(step.highlight ?? []);
  const heading = useRef<HTMLHeadingElement>(null);
  const currentQuery = caseToQuery(state);
  const latestQuery = useRef(currentQuery);
  useEffect(() => { latestQuery.current = currentQuery; }, [currentQuery]);
  useEffect(() => { heading.current?.focus(); }, []);

  useEffect(() => {
    const next = caseFromQuery(query);
    replaceCase(next);
    const ui = useUiStore.getState();
    const focus = lat != null && lng != null && altitude != null ? { lat, lng, altitude } : (region ? { ...regionLatLng(region), altitude: 1.5 } : null);
    if (focus && Number.isFinite(focus.lat) && Math.abs(focus.lat) <= 90 && Number.isFinite(focus.lng) && Math.abs(focus.lng) <= 180) ui.flyTo(focus);
    ui.setHighlight({ kind: "tour", regions: JSON.parse(highlight) as string[], arcFrom: null });
    if (reveal !== undefined) ui.setReveal(reveal);
  }, [query, reveal, lat, lng, altitude, highlight, region, replaceCase]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setPlayback((previous) => {
        if (latestQuery.current !== tour.steps[previous.index].query) return { ...previous, playing: false };
        const next = Math.min(previous.index + 1, tour.steps.length - 1);
        return { index: next, playing: next < tour.steps.length - 1 };
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [playing, tour.steps]);

  useEffect(() => () => {
    const ui = useUiStore.getState();
    if (ui.highlight.kind === "tour") ui.clearHighlight();
    useUiStore.setState({ focus: snapshot.focus, predictMode: snapshot.predictMode, reveal: snapshot.reveal });
  }, [snapshot]);

  return <section aria-label={c.title} className="space-y-3 border-t border-hairline pt-3 text-panel">
    <h3 ref={heading} tabIndex={-1} className="label-mono focus-visible:outline-none">{tour.title}</h3>
    <div aria-live="polite" aria-atomic="true"><p className="text-scale">{c.step} {index + 1} {c.of} {tour.steps.length}</p><p>{step.caption}</p></div>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={index === 0} onClick={() => setPlayback({ index: index - 1, playing: false })}>{c.prev}</Button>
      <Button size="sm" variant="outline" disabled={index === tour.steps.length - 1} onClick={() => setPlayback({ index: index + 1, playing: false })}>{c.next}</Button>
      <Button size="sm" variant="outline" onClick={() => setPlayback({ index: playing ? index : index === tour.steps.length - 1 ? 0 : index, playing: !playing })}>{playing ? c.pause : index === tour.steps.length - 1 ? c.replay : c.play}</Button>
      <Button size="sm" variant="ghost" onClick={() => { replaceCase(snapshot.state); onExit(); }}>{c.exit}</Button>
    </div>
    <p className="text-scale text-ink-2">{c.restore} {c.autoplay}</p>
  </section>;
}
