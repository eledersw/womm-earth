import { caseCopy } from "@/lib/copy/case";
export function YearsMeter({ nYears, yearsNeeded }: { nYears: number; yearsNeeded: number | null }) {
  if (!Number.isFinite(nYears) || nYears <= 0 || yearsNeeded == null || !Number.isInteger(yearsNeeded) || yearsNeeded < 0 || yearsNeeded > 50) return null;
  const total = nYears + yearsNeeded;
  const c = caseCopy.explorations;
  return <div className="mt-3 space-y-2">
    <p className="figure">≈{yearsNeeded} {c.moreYears}</p>
    <meter aria-label={c.years} min={0} max={total} value={nYears} className="w-full">{nYears}/{total}</meter>
    <p className="text-scale">{c.assumptions}</p>
  </div>;
}
