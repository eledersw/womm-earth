import Link from "next/link";
import { shellCopy } from "@/lib/copy/globe";

export const metadata = { title: `About · ${shellCopy.productName}` };

// Placeholder until docs/pitch/COPY.md "About" and docs/DATA_CATALOG.md attribution
// are written (frontend-shell plan, Task 8). Only states facts already true.
export default function About() {
  return (
    <main className="chart-paper min-h-dvh px-6 py-10">
      <article className="mx-auto max-w-[66ch] rounded-sm border border-rule bg-paper-leaf px-8 py-8 shadow-[0_2px_8px_rgb(20_23_26/0.12)]">
        <h1 className="font-condensed text-3xl font-bold tracking-[0.06em] uppercase">
          {shellCopy.productName}
        </h1>
        <p className="mt-4">
          A guided trend investigation for NASA Space Apps 2026, <em>Be An Earth System Trend
          Detective!</em> Pick something NASA measures or models, choose a place and a period, and
          see whether it is really changing, and how sure we can be.
        </p>
        <h2 className="scale-label mt-8 text-ink-2">Data</h2>
        <p className="mt-2">
          NASA POWER monthly data (MERRA-2 reanalysis and CERES satellite-derived products) and
          MODIS Aqua aerosol optical depth via NASA Giovanni. Full citations are being added.
        </p>
        <h2 className="scale-label mt-8 text-ink-2">How we test</h2>
        <p className="mt-2">
          Verdicts use one value per year and an autocorrelation-corrected Mann-Kendall test with
          Sen&apos;s slope, cross-checked with linear regression. The full method is being written
          up.
        </p>
        <p className="mt-8">
          <Link href="/" className="font-semibold text-ink">
            ← Back to the case
          </Link>
        </p>
      </article>
    </main>
  );
}
