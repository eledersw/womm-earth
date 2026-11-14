"use client";
import { useRef, useState } from "react";
import type { Region } from "@/lib/api/types";
import type { Tour } from "@/lib/tour/types";
import { tours, currentCaseTour } from "@/lib/tour/tours";
import { useCase } from "@/lib/state/use-case";
import { tourCopy as c } from "@/lib/copy/tour";
import { Button } from "@/components/ui/button";
import { TourPlayer } from "./TourPlayer";
export function TourLauncher({ regions, availableTours = tours, onStart }: { regions: Record<string, Region>; availableTours?: Tour[]; onStart?: (tour: Tour, button: HTMLButtonElement) => void }) {
  const { state } = useCase();
  const [active, setActive] = useState<Tour | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  function start(tour: Tour, button: HTMLButtonElement) { if (onStart) { onStart(tour, button); return; } trigger.current = button; setActive(tour); }
  if (active) return <TourPlayer key={active.id} tour={active} regions={regions} onExit={() => {
    setActive(null);
    requestAnimationFrame(() => { if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true }); else document.querySelector<HTMLButtonElement>('[data-tour-current]')?.focus({ preventScroll: true }); });
  }} />;
  return <section aria-label={c.title} className="space-y-3 text-panel">
    {!availableTours.length && <p className="text-scale text-ink-2">{c.unavailable}</p>}
    {availableTours.map((tour) => <div key={tour.id}><p>{tour.title}</p><Button variant="outline" onClick={(e) => start(tour, e.currentTarget)}>{c.watch}: {tour.title}</Button></div>)}
    <Button data-tour-current variant="outline" onClick={(e) => start(currentCaseTour(state), e.currentTarget)}>{c.current}</Button>
  </section>;
}
