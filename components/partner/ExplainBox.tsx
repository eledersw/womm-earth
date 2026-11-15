"use client";
import { useEffect, useMemo, useState } from "react";
import type { RegionAnalysis, Variable } from "@/lib/api/types";
import type { ReadingLevel } from "@/lib/state/case-codec";
import { caseKey } from "@/lib/state/case-codec";
import { useCase } from "@/lib/state/use-case";
import { partnerCopy } from "@/lib/copy/partner";
import { variableLabel } from "@/lib/copy/case";
import { readSse } from "@/lib/partner/sse-client";
import { inspectEvidence } from "@/lib/partner/evidence";
import { renderVerdict } from "@/lib/partner/verdict-templates";
import { approvedDemo } from "@/lib/partner/demo-cache";
import demos from "@/lib/partner/demo-explanations.json";
import type { ExplainInput } from "@/lib/partner/input";
import { Button } from "@/components/ui/button";

type Props = { result: RegionAnalysis; variable: Variable; regionName: string; level: ReadingLevel };
export function ExplainBox(props: Props) {
  const { state } = useCase();
  const key = caseKey(state);
  const demo = approvedDemo(demos, state, props.result.region.id, props.level);
  const input = useMemo<ExplainInput>(() => ({ mode: "explain", level: props.level, analysis: props.result, variable: props.variable, regionName: props.regionName,
    period: `${state.from}–${state.to}`, seasonLabel: state.season === "CUSTOM" ? `CUSTOM (${state.months?.join(",")})` : state.season,
  }), [props.level, props.result, props.variable, props.regionName, state.from, state.to, state.season, state.months]);
  if (props.result.verdict.tier === "too_short") return null;
  const evidence = inspectEvidence(props.result, state);
  if (evidence.status !== "combined" && evidence.status !== "mk_only") {
    const verdict = renderVerdict(props.result, { variableName: variableLabel(props.variable), unit: props.variable.unit, regionName: props.regionName, period: input.period, seasonLabel: input.seasonLabel }, props.level);
    return <section aria-label={partnerCopy.explain} className="mt-3 border-t pt-3 text-sm"><p role="alert">{verdict.body}</p></section>;
  }
  if (demo) return <section aria-label={partnerCopy.explain} className="mt-3 border-t pt-3 text-sm"><p>{demo}</p></section>;
  return <StreamedExplanation key={`${key}:${props.level}:${props.result.region.id}`} input={input} />;
}
function StreamedExplanation({ input }: { input: ExplainInput }) {
  const [attempt, setAttempt] = useState(0);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"loading" | "done" | "error" | "stopped">("loading");
  const [message, setMessage] = useState("");
  const [controller, setController] = useState<AbortController | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    let alive = true;
    const start = async () => {
      setController(abort); setText(""); setStatus("loading"); setMessage("");
      let failed = false;
      try {
        const response = await fetch("/api/partner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input), signal: abort.signal });
        await readSse(response, (event) => {
          if (!alive || abort.signal.aborted) return;
          if (event.type === "text" && !failed) setText((old) => old + event.text);
          if (event.type === "error") { failed = true; setText(""); setMessage(event.message); setStatus("error"); }
          if (event.type === "done" && !failed) setStatus("done");
        }, { signal: abort.signal });
      } catch {
        if (alive && !abort.signal.aborted) { setText(""); setMessage(partnerCopy.offline); setStatus("error"); }
      }
    };
    // React Strict Mode replays effects in development. Defer starting the
    // request so a disposed replay never reaches the paid endpoint.
    void Promise.resolve().then(() => { if (alive) return start(); });
    return () => { alive = false; abort.abort(); };
  }, [input, attempt]);
  return <section aria-label={partnerCopy.explain} className="mt-3 space-y-2 border-t pt-3 text-sm" aria-busy={status === "loading"}>
    <div aria-live="polite">
      {status === "loading" && <p>{text ? partnerCopy.draft : partnerCopy.loading}</p>}
      {!!text && <p className="whitespace-pre-wrap">{text}</p>}
      {status === "error" && <p role="alert">{message || partnerCopy.offline}</p>}
      {status === "stopped" && <p>{partnerCopy.cancelled}</p>}
    </div>
    {status === "loading" ? <Button size="sm" variant="outline" onClick={() => { controller?.abort(); setText(""); setStatus("stopped"); }}>{partnerCopy.stop}</Button>
      : status !== "done" && <Button size="sm" variant="outline" onClick={() => setAttempt((n) => n + 1)}>{partnerCopy.retry}</Button>}
  </section>;
}
