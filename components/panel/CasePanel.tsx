"use client";

import { X } from "lucide-react";
import { Suspense, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CASE_RESULTS_SLOT } from "@/components/shell/slots";
import { caseCopy } from "@/lib/copy/case";
import { partnerCopy } from "@/lib/copy/partner";
import { useCase } from "@/lib/state/use-case";
import { LeadStep } from "./steps/LeadStep";
import { SceneStep } from "./steps/SceneStep";
import { TimelineStep } from "./steps/TimelineStep";
import { EvidenceStep } from "./steps/EvidenceStep";
import { VerdictStep } from "./steps/VerdictStep";
import { availableHere, clampPeriod } from "./controls";
import { useVariables } from "./useVariables";
import { useRegions } from "./useRegions";
import { PartnerChat } from "@/components/partner/PartnerChat";
import { useAnalysis } from "./useAnalysis";

// No props: the page owns the slot. Search params stay inside this boundary.
export function CasePanel() {
  return <Suspense fallback={<p role="status" className="p-5">{caseCopy.loading}</p>}><CasePanelContent /></Suspense>;
}

// One flow: set up Lead, Scene and Timeline, press Investigate, then the
// evidence, the verdict with the partner's explanation, and follow-up
// questions open on the results pane. Nothing runs while you are choosing.
function CasePanelContent() {
  const { state, setCase } = useCase();
  const variables = useVariables();
  const regions = useRegions();
  const variable = variables.byId[state.variable];
  const period = variable ? clampPeriod(state.from, state.to, variable) : null;
  const inPeriod = period?.from === state.from && period?.to === state.to;
  const valid = !!variable && inPeriod && !regions.loading && !regions.error && availableHere(state.variable, state.regions, regions.byId);
  const analysis = useAnalysis(state, valid);
  const [open, setOpen] = useState(false);
  const submitted = analysis.loading || !!analysis.data || !!analysis.error;

  // Shared links may predate the catalogue or exceed the selected variable's
  // coverage. Correct the URL before issuing an analysis request.
  useEffect(() => {
    if (variable && (state.from < variable.start_year || state.to > variable.end_year || state.to < variable.start_year || state.from > variable.end_year)) {
      setCase(clampPeriod(state.from, state.to, variable));
    }
  }, [variable, state.from, state.to, setCase]);

  function investigate() {
    setOpen(true);
    analysis.calculate();
  }

  const controls = { state, setCase };
  return (
    <>
      <section aria-label={caseCopy.panel} className="flex min-h-full w-full min-w-0 flex-col">
        <ol aria-label={caseCopy.stepsLabel} className="flex-1 space-y-3 px-5 pt-5 pb-4">
          <li><LeadStep {...controls} variables={variables.variables}
            loading={variables.loading || regions.loading} error={!!variables.error || !!regions.error}
            onRetry={() => { variables.retry(); regions.retry(); }} /></li>
          <li><SceneStep {...controls} regions={regions.byId} loading={regions.loading} error={!!regions.error} onRetry={regions.retry} /></li>
          <li><TimelineStep {...controls} variable={variable} loading={variables.loading} error={!!variables.error} onRetry={variables.retry} /></li>
        </ol>

        <div className="sticky bottom-0 space-y-3 border-t border-hairline bg-space/55 px-5 pt-4 pb-5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <span className="label-mono">{partnerCopy.readingLevel}</span>
            <ToggleGroup type="single" value={state.level} variant="outline" size="sm" aria-label={partnerCopy.readingLevel}
              onValueChange={(level) => { if (level === "student" || level === "scientist") setCase({ level }); }}>
              <ToggleGroupItem value="student">{partnerCopy.student}</ToggleGroupItem>
              <ToggleGroupItem value="scientist">{partnerCopy.scientist}</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Button size="lg" className="w-full" onClick={investigate} disabled={!valid || analysis.loading}>
            {analysis.loading ? caseCopy.controls.calculating : caseCopy.controls.calculate}
          </Button>
          <p className="label-mono text-center">{valid ? caseCopy.investigateHint : caseCopy.chooseFirst}</p>
        </div>
      </section>

      {open && submitted ? (
        <Results onClose={() => setOpen(false)}>
          <EvidenceStep results={analysis.data?.results} unit={variable?.unit} loading={analysis.loading} error={!!analysis.error} onRetry={analysis.retry} />
          <VerdictStep variable={variable} results={analysis.data?.results} level={state.level} ratioScale={variable?.ratio_scale}
            context={{ variableName: variable?.name ?? state.variable, unit: variable?.unit ?? "", period: `${state.from}–${state.to}`, seasonLabel: state.season === "CUSTOM" ? `${caseCopy.controls.seasons.CUSTOM} (${state.months?.join(", ")})` : caseCopy.controls.seasons[state.season] }}
            loading={analysis.loading} error={!!analysis.error} onRetry={analysis.retry} />
          {analysis.data ? <div className="rounded-xl border bg-card p-4"><PartnerChat /></div> : null}
        </Results>
      ) : null}
    </>
  );
}

const noSubscribe = () => () => {};

// The results pane: portalled into the shell's right-hand slot when it exists,
// otherwise rendered in place (tests, or a page without the shell).
function Results({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const slot = useSyncExternalStore(noSubscribe, () => document.getElementById(CASE_RESULTS_SLOT), () => null);
  const pane = (
    <section aria-label={caseCopy.results} className="glass pointer-events-auto relative flex max-h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
        <h2 className="label-mono text-[0.8rem] text-silver">{caseCopy.results}</h2>
        <button type="button" onClick={onClose} aria-label={caseCopy.hideResults}
          className="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-well-2 hover:text-ink">
          <X aria-hidden className="size-4" strokeWidth={1.75} />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 pb-5 [scrollbar-width:thin]">{children}</div>
    </section>
  );
  return slot ? createPortal(pane, slot) : pane;
}
