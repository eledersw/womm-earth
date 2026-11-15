"use client";

import type { Tour } from "@/lib/tour/types";
import { TourPlayer } from "@/components/tour/TourPlayer";
import { TourLauncher } from "@/components/tour/TourLauncher";
import { displayUnit } from "@/components/globe/palette";
import { X } from "lucide-react";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { CASE_EXPLAIN_SLOT, CASE_RESULTS_SLOT } from "@/components/shell/slots";
import { caseCopy, variableLabel } from "@/lib/copy/case";
import { caseKey } from "@/lib/state/case-codec";
import { useUiStore } from "@/lib/state/ui-store";
import { CorrelationView } from "./CorrelationView";
import { MirrorList } from "./MirrorList";
import { useCase } from "@/lib/state/use-case";
import { LeadStep } from "./steps/LeadStep";
import { SceneStep } from "./steps/SceneStep";
import { TimelineStep } from "./steps/TimelineStep";
import { EvidenceStep } from "./steps/EvidenceStep";
import { VerdictStep } from "./steps/VerdictStep";
import { availableHere, clampPeriod } from "./controls";
import { useVariables } from "./useVariables";
import { useRegions } from "./useRegions";
import { ExplainBox } from "@/components/partner/ExplainBox";
import { PartnerChat } from "@/components/partner/PartnerChat";
import { useAnalysis } from "./useAnalysis";

// No props: the page owns the slot. Search params stay inside this boundary.
export function CasePanel() {
  return <Suspense fallback={<p role="status" className="p-4">{caseCopy.loading}</p>}><CasePanelContent /></Suspense>;
}

// One flow: set up Lead, Scene and Timeline, press Investigate. The evidence and
// verdict open in the results pane; the explanations and follow-up questions
// live in the explain-and-ask pane, which is always open. Nothing runs while
// you are choosing.
function CasePanelContent() {
  const { state, setCase } = useCase();
  const predict = useUiStore((s) => s.predictMode);
  const hidden = useUiStore((s) => s.predictMode && !s.reveal);
  const variables = useVariables();
  const regions = useRegions();
  const variable = variables.byId[state.variable];
  const period = variable ? clampPeriod(state.from, state.to, variable) : null;
  const inPeriod = period?.from === state.from && period?.to === state.to;
  const valid = !!variable && inPeriod && !regions.loading && !regions.error && availableHere(state.variable, state.regions, regions.byId);
  const analysis = useAnalysis(state, valid);
  const [tour, setTour] = useState<Tour | null>(null);
  const tourTrigger = useRef<HTMLButtonElement | null>(null);
  function startTour(next: Tour, button: HTMLButtonElement) { tourTrigger.current = button; setTour(next); }
  function exitTour() { setTour(null); requestAnimationFrame(() => { if (tourTrigger.current?.isConnected) tourTrigger.current.focus({ preventScroll: true }); else document.querySelector<HTMLButtonElement>("[data-tour-current]")?.focus({ preventScroll: true }); }); }
  const [open, setOpen] = useState(false);
  const submitted = analysis.loading || !!analysis.data || !!analysis.error;
  const explained = (hidden ? [] : analysis.data?.results ?? []).filter((r) => r.verdict.tier !== "too_short");

  // Shared links may predate the catalogue or exceed the selected variable's
  // coverage. Correct the URL before issuing an analysis request.
  useEffect(() => {
    if (variable && (state.from < variable.start_year || state.to > variable.end_year || state.to < variable.start_year || state.from > variable.end_year)) {
      setCase(clampPeriod(state.from, state.to, variable));
    }
  }, [variable, state.from, state.to, setCase]);

  function investigate() {
    if (predict) useUiStore.getState().setReveal(false);
    setOpen(true);
    analysis.calculate();
  }

  const controls = { state, setCase };
  return (
    <>
      <section aria-label={caseCopy.panel} className="flex min-h-full w-full min-w-0 flex-col">
        <ol aria-label={caseCopy.stepsLabel} className="flex-1 space-y-2.5 px-3.5 pt-3.5 pb-3">
          <li><LeadStep {...controls} variables={variables.variables}
            loading={variables.loading || regions.loading} error={!!variables.error || !!regions.error}
            onRetry={() => { variables.retry(); regions.retry(); }} /></li>
          <li><SceneStep {...controls} regions={regions.byId} loading={regions.loading} error={!!regions.error} onRetry={regions.retry} /></li>
          <li><TimelineStep {...controls} variable={variable} loading={variables.loading} error={!!variables.error} onRetry={variables.retry} /></li>
        </ol>

        <div className="px-3.5 pb-2">
          {tour ? <TourPlayer key={tour.id} tour={tour} regions={regions.byId} onExit={exitTour} /> : !submitted && !regions.loading ? <TourLauncher regions={regions.byId} onStart={startTour} /> : null}
        </div>
        <div className="sticky bottom-0 space-y-2 border-t border-hairline bg-space/55 px-3.5 pt-3 pb-3.5 backdrop-blur-md">
          <label className="flex items-center gap-2 text-scale">
            <input type="checkbox" checked={predict} onChange={(e) => {
              useUiStore.getState().setPredictMode(e.target.checked);
              useUiStore.getState().setReveal(!e.target.checked);
            }} />{caseCopy.explorations.predict}
          </label>
          <Button size="lg" className="w-full" onClick={investigate} disabled={!valid || analysis.loading}>
            {analysis.loading ? caseCopy.controls.calculating : caseCopy.controls.calculate}
          </Button>
          <p className="label-mono text-center leading-snug">{valid ? caseCopy.investigateHint : caseCopy.chooseFirst}</p>
        </div>
      </section>

      {open && submitted ? (
        <Pane slotId={CASE_RESULTS_SLOT} label={caseCopy.results} onClose={() => setOpen(false)}>
          <EvidenceStep results={hidden ? undefined : analysis.data?.results} unit={displayUnit(variable?.unit)} loading={analysis.loading} error={!!analysis.error} onRetry={analysis.retry}>{hidden && <p>{caseCopy.explorations.predictEvidence}</p>}</EvidenceStep>
          <VerdictStep key={caseKey(state)} variable={variable} results={analysis.data?.results} level={state.level} ratioScale={variable?.ratio_scale} showExplanation={false}
            context={{ variableName: variable ? variableLabel(variable) : state.variable, unit: variable?.unit ?? "", period: `${state.from}–${state.to}`, seasonLabel: state.season === "CUSTOM" ? `${caseCopy.controls.seasons.CUSTOM} (${state.months?.join(", ")})` : caseCopy.controls.seasons[state.season] }}
            loading={analysis.loading} error={!!analysis.error} onRetry={analysis.retry} />
          {analysis.data && !hidden ? <>
            <CorrelationView state={state} variables={variables.variables} />
            <MirrorList key={caseKey(state)} state={state} setCase={setCase} regions={regions.byId} unit={displayUnit(variable?.unit)} />
          </> : null}
        </Pane>
      ) : null}

      <Pane slotId={CASE_EXPLAIN_SLOT} label={caseCopy.explainPane}>
        {variable && explained.length ? (
          explained.map((r) => (
            <div key={r.region.id} className="rounded-xl border bg-card px-3.5 pt-2.5 pb-3">
              <p className="label-mono text-silver">{r.region.name}</p>
              <ExplainBox result={r} variable={variable} regionName={r.region.name} level={state.level} />
            </div>
          ))
        ) : (
          <p className="text-sm text-ink-2">{caseCopy.explainEmpty}</p>
        )}
        <div className="rounded-xl border bg-card p-3.5"><PartnerChat />{!tour && submitted ? <TourLauncher regions={regions.byId} onStart={startTour} /> : null}</div>
      </Pane>
    </>
  );
}

const noSubscribe = () => () => {};

// A glass pane portalled into one of the shell's right-hand slots when it
// exists, otherwise rendered in place (tests, or a page without the shell).
function Pane({ slotId, label, onClose, children }: { slotId: string; label: string; onClose?: () => void; children: ReactNode }) {
  const slot = useSyncExternalStore(noSubscribe, () => document.getElementById(slotId), () => null);
  const pane = (
    <section aria-label={label} className="glass pointer-events-auto relative flex h-full max-h-full min-h-0 flex-col">
      <div className="flex min-h-10 items-center justify-between gap-3 px-3.5 pt-2.5 pb-1.5">
        <h2 className="label-mono text-silver">{label}</h2>
        {onClose ? (
          <button type="button" onClick={onClose} aria-label={caseCopy.hideResults}
            className="grid size-7 place-items-center rounded-full text-ink-2 transition-colors hover:bg-well-2 hover:text-ink">
            <X aria-hidden className="size-3.5" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-3.5 pb-3.5 [scrollbar-width:thin]">{children}</div>
    </section>
  );
  return slot ? createPortal(pane, slot) : pane;
}
