import Link from "next/link";
import { shellCopy } from "@/lib/copy/globe";

export const metadata = { title: `About · ${shellCopy.productName}` };

// Placeholder until docs/pitch/COPY.md "About" and docs/DATA_CATALOG.md attribution
// are written (frontend-shell plan, Task 8). Only states facts already true.
export default function About() {
  return (
    <main className="relative min-h-dvh px-6 py-16">
      <div aria-hidden className="starfield pointer-events-none fixed inset-0" />
      <div aria-hidden className="starfield-bright pointer-events-none fixed inset-0" />
      <article className="glass relative mx-auto max-w-[64ch] px-8 py-10 sm:px-12">
        <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-extralight text-silver">
          {shellCopy.productName}
        </h1>
        <p className="mt-6 text-ink-2">
          A guided trend investigation for NASA Space Apps 2026, <em>Be An Earth System Trend
          Detective!</em> Pick something NASA measures or models, choose a place and a period, and
          see whether it is really changing, and how sure we can be.
        </p>
        <h2 className="label-mono mt-10">Data</h2>
        <p className="mt-3 text-ink-2">
          NASA POWER monthly data (MERRA-2 reanalysis and CERES satellite-derived products) and
          MODIS Aqua aerosol optical depth via NASA Giovanni. Full citations are being added.
        </p>
        <h2 className="label-mono mt-10">How we test</h2>
        <p className="mt-3 text-ink-2">
          Verdicts use one value per year and an autocorrelation-corrected Mann-Kendall test with
          Sen&apos;s slope, cross-checked with linear regression. The full method is being written
          up.
        </p>
        <p className="mt-10">
          <Link href="/" className="label-nav text-ink">
            ← {shellCopy.backToCase}
          </Link>
        </p>
      </article>
    </main>
  );
}
