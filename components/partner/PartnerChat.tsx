"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { partnerCopy as c } from "@/lib/copy/partner";
import { useCase } from "@/lib/state/use-case";
import { caseFromQuery, caseKey } from "@/lib/state/case-codec";
import { readSse } from "@/lib/partner/sse-client";
import { checkNumbers } from "@/lib/partner/number-check";
type Message = { role: "user" | "assistant"; content: string };
type Proposal = { query: string; title: string };
export function PartnerChat() {
  const { state, replaceCase } = useCase();
  const [history, setHistory] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState("");
  const [draft, setDraft] = useState("");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(false);
  const active = useRef<AbortController | null>(null);
  const identity = `${caseKey(state)}:${state.level}`;
  useEffect(() => () => active.current?.abort(), [identity]);
  async function send(text: string) {
    if (active.current || !text.trim()) return;
    const abort = new AbortController(); active.current = abort;
    const previous = history.slice(-18);
    const messages: Message[] = [...previous, { role: "user", content: text.trim() }];
    setPending(text.trim()); setQuestion(""); setBusy(true); setChecking(false); setError(""); setDraft(""); setProposals([]); setWarning(false);
    let reply = ""; let failed = false; let done = false;
    const results: unknown[] = []; const offered: Proposal[] = [];
    try {
      const response = await fetch("/api/partner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "chat", level: state.level, case: state, messages }), signal: abort.signal });
      await readSse(response, (event) => {
        if (active.current !== abort || abort.signal.aborted) return;
        if (event.type === "text") { reply += event.text; setDraft(reply); setChecking(false); }
        if (event.type === "tool_call") setChecking(true);
        if (event.type === "tool_result") { results.push(event.data); setChecking(false); }
        if (event.type === "propose_case") offered.push({ query: event.query, title: event.title });
        if (event.type === "error") { failed = true; setError(event.message); setDraft(""); }
        if (event.type === "done") done = true;
      }, { signal: abort.signal });
      if (abort.signal.aborted) return;
      if (!failed && done && reply.trim()) {
        setHistory([...messages, { role: "assistant", content: reply }]); setDraft(""); setProposals(offered);
        if (process.env.NODE_ENV !== "production") setWarning(!checkNumbers(reply, results).ok);
      } else { setQuestion(text); setDraft(""); if (!failed) setError(c.chatRetry); }
    } catch { if (!abort.signal.aborted) { setError(c.chatRetry); setQuestion(text); setDraft(""); } }
    finally { if (active.current === abort) { if (abort.signal.aborted) { setDraft(""); setProposals([]); setQuestion(text); } active.current = null; setBusy(false); setChecking(false); } }
  }
  function submit(event: FormEvent) { event.preventDefault(); void send(question); }
  return <section aria-label={c.title} className="space-y-4 text-panel text-ink">
    <h2 className="scale-label text-scale">{c.title}</h2>
    <p>{c.chatIntro}</p>
    <ul aria-label={c.chatHistory} className="space-y-4">
      {history.map((m, i) => <li key={i} className="border-b border-rule pb-3"><p className="scale-label text-scale">{m.role === "user" ? c.you : c.assistant}</p><p className="whitespace-pre-wrap break-words">{m.content}</p></li>)}
      {busy && <li><p className="scale-label text-scale">{c.you}</p><p>{pending}</p></li>}
    </ul>
    <div aria-live="polite">
      {busy && <p className="scale-label text-scale">{checking ? c.checking : c.draft}</p>}
      {draft && <p className="whitespace-pre-wrap break-words">{draft}</p>}
      {error && <p role="alert">{c.offline} {error}</p>}
      {warning && <p className="text-scale">{c.numberWarning}</p>}
    </div>
    {proposals.map((proposal, i) => <div key={i} className="border-t border-rule pt-3">
      <p>{proposal.title}</p><Button variant="outline" onClick={() => replaceCase(caseFromQuery(proposal.query))}>{c.openCase}</Button>
    </div>)}
    {!history.length && <div className="flex flex-wrap gap-2">{c.starters.map((starter) => <Button key={starter} variant="outline" disabled={busy} className="h-auto whitespace-normal text-left text-scale" onClick={() => { setQuestion(starter); }}>{starter}</Button>)}</div>}
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="partner-question" className="scale-label text-scale">{c.chatLabel}</label>
      <textarea id="partner-question" maxLength={6000} value={question} onChange={(e) => setQuestion(e.target.value)} disabled={busy} rows={3} className="w-full border border-rule bg-paper p-2 text-panel focus-visible:outline-2" />
      <Button type="submit" disabled={busy || !question.trim()}>{c.send}</Button>
      {busy && <Button type="button" variant="outline" onClick={() => { active.current?.abort(); setDraft(""); setBusy(false); setChecking(false); setQuestion(pending); }}>{c.stop}</Button>}
    </form>
  </section>;
}
