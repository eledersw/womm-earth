"use client";

import { displayUnit } from "@/components/globe/palette";
import { Share2, X } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { CASE_EXPLAIN_SLOT, CASE_RESULTS_SLOT } from "@/components/shell/slots";
import { caseCopy, variableLabel } from "@/lib/copy/case";
import { shareCopy } from "@/lib/copy/share";
import { useUiStore } from "@/lib/state/ui-store";
import { caseToQuery } from "@/lib/state/case-codec";
import { caseKey } from "@/lib/state/case-codec";
import { CorrelationView } from "./CorrelationView";
import { MultivariableComparison } from "./MultivariableComparison";
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
import { GaiaMascot } from "@/components/partner/GaiaMascot";
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
  const variables = useVariables();
  const regions = useRegions();
  const variable = variables.byId[state.variable];
  const period = variable ? clampPeriod(state.from, state.to, variable) : null;
  const inPeriod = period?.from === state.from && period?.to === state.to;
  const valid = state.regions.length > 0 && !!variable && inPeriod && !regions.loading && !regions.error && availableHere(state.variable, state.regions, regions.byId);
  const analysis = useAnalysis(state, valid);
  const [open, setOpen] = useState(false);
  const submitted = analysis.loading || !!analysis.data || !!analysis.error;
  const explained = (analysis.data?.results ?? []).filter((r) => r.verdict.tier !== "too_short");

  // Shared links may predate the catalogue or exceed the selected variable's
  // coverage. Correct the URL before issuing an analysis request.
  useEffect(() => {
    if (variable && (state.from < variable.start_year || state.to > variable.end_year || state.to < variable.start_year || state.from > variable.end_year)) {
      setCase(clampPeriod(state.from, state.to, variable));
    }
  }, [variable, state.from, state.to, setCase]);

  // ?run=1 marks the results as open, so a copied link reopens them. A link
  // that arrives with it investigates once the catalogues allow; after that it
  // only follows the results pane (choosing still never runs anything).
  const [run, setRun] = useQueryState("run", parseAsStringLiteral(["1"] as const).withOptions({ history: "replace" }));
  const arrivedWithRun = useRef(run === "1");
  const showing = open && submitted;

  function investigate() {
    setOpen(true);
    analysis.calculate();
    void setRun("1");
  }

  // Declared first on purpose: in the commit where the arrival runs, this must
  // still see the pending arrival and leave ?run=1 alone.
  useEffect(() => {
    if (run && !arrivedWithRun.current && !showing) void setRun(null);
  }, [run, showing, setRun]);

  const { calculate } = analysis;
  useEffect(() => {
    if (!arrivedWithRun.current || !valid) return;
    arrivedWithRun.current = false;
    setOpen(true);
    calculate();
  }, [valid, calculate]);

  function share() {
    const href = `${window.location.origin}${window.location.pathname}?${caseToQuery(state)}&run=1`;
    useUiStore.getState().openShare({ href, state });
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

        <div className="sticky bottom-0 space-y-2 border-t border-hairline bg-space-2 px-3.5 pt-3 pb-3.5">
          <Button size="lg" className="w-full" onClick={investigate} disabled={!valid || analysis.loading}>
            {analysis.loading ? caseCopy.controls.calculating : caseCopy.controls.calculate}
          </Button>
          <p className="label-mono text-center leading-snug">{valid ? caseCopy.investigateHint : caseCopy.chooseFirst}</p>
        </div>
      </section>

      {showing ? (
        <Pane slotId={CASE_RESULTS_SLOT} label={caseCopy.results} onClose={() => setOpen(false)}
          action={analysis.data ? (
            <button type="button" onClick={share}
              className="label-mono inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-ink-2 transition-colors hover:bg-well-2 hover:text-ink">
              <Share2 aria-hidden className="size-3.5" strokeWidth={1.75} /> {shareCopy.openInPanel}
            </button>
          ) : null}>
          <VerdictStep key={caseKey(state)} variable={variable} results={analysis.data?.results} level={state.level} ratioScale={variable?.ratio_scale} showExplanation={false} compact
            context={{ variableName: variable ? variableLabel(variable) : state.variable, unit: variable?.unit ?? "", period: `${state.from}–${state.to}`, seasonLabel: state.season === "CUSTOM" ? `${caseCopy.controls.seasons.CUSTOM} (${state.months?.join(", ")})` : caseCopy.controls.seasons[state.season] }}
            loading={analysis.loading} error={!!analysis.error} errorMessage={analysis.error ?? undefined} onRetry={analysis.retry} />
          <EvidenceStep results={analysis.data?.results} unit={displayUnit(variable?.unit)} loading={analysis.loading} error={!!analysis.error} errorMessage={analysis.error ?? undefined} onRetry={analysis.retry} />
          {analysis.data ? <>
            <CorrelationView state={state} variables={variables.variables} />
            <MultivariableComparison key={caseKey(state)} state={state} variables={variables.variables} regions={regions.byId} caseResults={analysis.data?.results} />
          </> : null}
        </Pane>
      ) : null}

      <Pane slotId={CASE_EXPLAIN_SLOT} label={caseCopy.explainPane} badge={<GaiaMascot />}>
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
        <div className="rounded-xl border bg-card p-3.5"><PartnerChat /></div>
      </Pane>
    </>
  );
}

const noSubscribe = () => () => {};

// A glass pane portalled into one of the shell's right-hand slots when it
// exists, otherwise rendered in place (tests, or a page without the shell).
function Pane({ slotId, label, onClose, badge, action, children }: { slotId: string; label: string; onClose?: () => void; badge?: ReactNode; action?: ReactNode; children: ReactNode }) {
  const slot = useSyncExternalStore(noSubscribe, () => document.getElementById(slotId), () => null);
  const pane = (
    <section aria-label={label} className="glass pointer-events-auto relative flex h-full max-h-full min-h-0 flex-col">
      {/* Perched on the pane's top edge: its feet rest on the border. */}
      {badge ? <div className="pointer-events-none absolute -top-[35px] right-6 z-10">{badge}</div> : null}
      <div className="flex min-h-10 items-center justify-between gap-3 px-3.5 pt-2.5 pb-1.5">
        <h2 className="label-mono text-silver">{label}</h2>
        <div className="ml-auto flex items-center gap-1">{action}</div>
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
