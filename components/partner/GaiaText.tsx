// Renders Gaia's light Markdown (paragraphs, **bold**, *italic*, `code`, bullet and
// numbered lists, short headings) as React elements. No HTML is injected.
import type { ReactNode } from "react";

type Item = { text: string; depth: number };
type Block = { kind: "p"; text: string } | { kind: "h"; text: string } | { kind: "ul"; items: Item[] } | { kind: "ol"; items: Item[] };

function blocks(source: string): Block[] {
  const out: Block[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) out.push({ kind: "p", text: para.join(" ") }); para = []; };
  for (const raw of source.replace(/\r/g, "").split("\n")) {
    const line = raw.trimEnd();
    const bullet = /^(\s*)[-*•]\s+(.*)$/.exec(line);
    const numbered = /^(\s*)\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (!line.trim()) { flush(); continue; }
    if (heading) { flush(); out.push({ kind: "h", text: heading[1] }); continue; }
    const item = bullet ?? numbered;
    if (item) {
      flush();
      const kind = bullet ? "ul" : "ol";
      const last = out.at(-1);
      const entry = { text: item[2], depth: Math.min(2, Math.floor(item[1].length / 2)) };
      if (last && last.kind === kind) last.items.push(entry); else out.push({ kind, items: [entry] });
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return out;
}

/** Inline **bold**, *italic* and `code`. */
function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={i} className="font-mono text-[0.9em]">{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export function GaiaText({ text }: { text: string }) {
  return (
    <div className="space-y-2 break-words">
      {blocks(text).map((b, i) => {
        if (b.kind === "h") return <p key={i} className="font-semibold text-ink">{inline(b.text)}</p>;
        if (b.kind === "p") return <p key={i}>{inline(b.text)}</p>;
        const List = b.kind === "ul" ? "ul" : "ol";
        const items = b.items;
        return (
          <List key={i} className={`m-0 space-y-1 pl-5 ${b.kind === "ul" ? "list-disc" : "list-decimal"}`}>
            {items.map((item, k) => <li key={k} style={item.depth ? { marginLeft: `${item.depth}rem` } : undefined}>{inline(item.text)}</li>)}
          </List>
        );
      })}
    </div>
  );
}
