import { caseCopy } from "@/lib/copy/case";
export function YearsMeter({ nYears, yearsNeeded }: { nYears: number; yearsNeeded: number | null }) {
  if (!Number.isFinite(nYears) || nYears <= 0 || yearsNeeded == null || !Number.isInteger(yearsNeeded) || yearsNeeded < 0 || yearsNeeded > 50) return null;
  const total = nYears + yearsNeeded;
  const c = caseCopy.explorations;
  return <div className="mt-4 space-y-2.5">
    <p className="figure text-[1.35rem]">≈{yearsNeeded} {c.moreYears}</p>
    {/* Native meter for assistive tech, restyled in globals.css (.years-meter). */}
    <meter aria-label={c.years} min={0} max={total} value={nYears} className="years-meter">{nYears}/{total}</meter>
    <div className="flex items-baseline justify-between gap-3 font-mono text-[0.72rem] tracking-[0.08em] text-ink-3 uppercase">
      <span>{nYears} {c.yearsMeasured}</span>
      <span>≈{yearsNeeded} {c.yearsToGo}</span>
    </div>
    <p className="text-scale text-ink-2">{c.assumptions}</p>
  </div>;
}
