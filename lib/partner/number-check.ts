export interface ExtractedNumber {
  raw: string;
  value: number;
  decimals: number;
}

function tokens(text: string): (ExtractedNumber & { index: number })[] {
  const result: (ExtractedNumber & { index: number })[] = [];
  const pattern = /[+−-]?(?:(?:\d{1,3}(?:[ \u00a0\u202f']\d{3})+|\d+)(?:[.,]\d+)*|[.,]\d+)(?:[eE][+−-]?\d+)?(?:[ \u00a0\u202f]?%)?/g;
  for (const match of text.matchAll(pattern)) {
    const raw = match[0];
    const index = match.index;
    if (/[\p{L}\p{N}_]/u.test(text[index - 1] ?? "")) continue;
    let normalized = raw.replace(/−/g, "-").replace(/[ \u00a0\u202f'%]/g, "");
    const parts = normalized.toLowerCase().split("e");
    let mantissa = parts[0];
    const exponent = Number(parts[1] ?? 0);
    if (mantissa.includes(",") && mantissa.includes(".")) {
      const commaDecimal = mantissa.lastIndexOf(",") > mantissa.lastIndexOf(".");
      mantissa = commaDecimal ? mantissa.replace(/\./g, "").replace(",", ".") : mantissa.replace(/,/g, "");
    } else if (mantissa.includes(",")) {
      mantissa = /^[+\-]?[1-9]\d{0,2}(?:,\d{3})+$/.test(mantissa)
        ? mantissa.replace(/,/g, "") : mantissa.replace(",", ".");
    } else if (/^[+\-]?\d{1,3}(?:\.\d{3}){2,}$/.test(mantissa)) {
      mantissa = mantissa.replace(/\./g, "");
    }
    normalized = `${mantissa}e${exponent}`;
    const value = Number(normalized);
    // This exemption is exactly the plan's year policy: bare four-digit years.
    if (/^\d{4}$/.test(raw) && value >= 1900 && value <= 2100) continue;
    const decimals = (mantissa.split(".")[1]?.length ?? 0) - exponent;
    result.push({ raw, value, decimals, index });
  }
  return result;
}

export function extractNumbers(text: string): ExtractedNumber[] {
  return tokens(text).map(({ raw, value, decimals }) => ({ raw, value, decimals }));
}

export function collectNumbers(data: unknown): number[] {
  const numbers: number[] = [];
  const seen = new WeakSet<object>();
  const visit = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) numbers.push(value);
    else if (value && typeof value === "object" && !seen.has(value)) {
      seen.add(value);
      Object.values(value).forEach(visit);
    }
  };
  visit(data);
  return numbers;
}

function collectPValues(data: unknown): number[] {
  const values: number[] = [];
  const seen = new WeakSet<object>();
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    for (const [key, child] of Object.entries(value)) {
      if (/^p(?:_?value)?$/i.test(key) && typeof child === "number" && Number.isFinite(child) && child >= 0 && child <= 1) values.push(child);
      else visit(child);
    }
  };
  visit(data);
  return values;
}

export function checkNumbers(text: string, toolResults: unknown[]): { ok: boolean; unmatched: string[] } {
  const numbers = collectNumbers(toolResults);
  const pValues = collectPValues(toolResults);
  const unmatched = tokens(text).filter(({ raw, value, decimals, index }) => {
    if (!Number.isFinite(value)) return true;
    const inequality = text.slice(0, index).match(/\bp(?:[- ]?value)?\s*([<>]=?|[≤≥])\s*$/i)?.[1];
    if (inequality) {
      return !pValues.some((p) => {
        if (inequality === "<") return p < value;
        if (inequality === ">") return p > value;
        if (inequality === "<=" || inequality === "≤") return p <= value;
        return p >= value;
      });
    }
    const matches = (candidate: number, scale: number) => {
      const shown = value * scale;
      const tolerance = Math.max(0.5 * 10 ** (-decimals) * scale, 0.01 * Math.abs(shown));
      return Math.abs(candidate - shown) <= tolerance + Number.EPSILON * Math.max(1, Math.abs(shown));
    };
    return !numbers.some((n) => matches(n, 1) || (raw.endsWith("%") && matches(n, 0.01)));
  }).map(({ raw }) => raw);
  return { ok: unmatched.length === 0, unmatched };
}

/** Keep supported parts of a chat answer when a separate line invents a number. */
export function keepGroundedLines(text: string, toolResults: unknown[]): string | null {
  if (checkNumbers(text, toolResults).ok) return text;
  const kept = text.split(/\r?\n/).filter((line) => checkNumbers(line, toolResults).ok);
  const answer = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return answer && checkNumbers(answer, toolResults).ok ? answer : null;
}
