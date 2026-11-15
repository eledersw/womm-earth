import Link from "next/link";
import type { ReactNode } from "react";
import { shellCopy } from "@/lib/copy/globe";

export const metadata = { title: `About · ${shellCopy.productName}` };

// Content from docs/science/METHODS.md (§2, §6, §9) and the attribution list in
// docs/DATA_CATALOG.md. Update both together. COPY.md's About section will
// replace the plain-language wording when Edur writes it.
const TIERS = [
  { name: "Confirmed", rule: "p < 0.05 on both tests", meaning: "Both tests detect a steady trend at the 5% significance level." },
  { name: "Not proven yet", rule: "0.05 ≤ p < 0.20", meaning: "The evidence isn't strong enough yet. It could be change or natural ups and downs." },
  { name: "No case", rule: "p ≥ 0.20", meaning: "No detectable steady trend. That is not the same as no change." },
  { name: "Too short to judge", rule: "fewer than 10 usable years", meaning: "Not enough data for a fair test, so no verdict is given." },
];

const SOURCES: { name: string; text: ReactNode }[] = [
  {
    name: "NASA POWER",
    text: (
      <>Prediction Of Worldwide Energy Resources, NASA Langley Research Center. Monthly values through the{" "}
        <A href="https://power.larc.nasa.gov/docs/services/api/temporal/monthly/">POWER monthly API</A> (AG community).</>
    ),
  },
  {
    name: "MERRA-2",
    text: (
      <>Gelaro et al. (2017), the Modern-Era Retrospective Analysis for Research and Applications, Version 2. Journal of Climate,{" "}
        <A href="https://doi.org/10.1175/JCLI-D-16-0758.1">doi:10.1175/JCLI-D-16-0758.1</A>. Reanalysis: a model constrained by observations.</>
    ),
  },
  {
    name: "CERES and GEWEX SRB",
    text: (
      <>Radiation, cloud and aerosol sources behind POWER. Rutan et al. (2015), CERES Synoptic product methodology,{" "}
        <A href="https://doi.org/10.1175/JTECH-D-14-00165.1">doi:10.1175/JTECH-D-14-00165.1</A>.</>
    ),
  },
  {
    name: "Natural Earth",
    text: (
      <>Country and region boundaries from <A href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</A>,
        public domain. Boundaries locate places; they are not climate observations.</>
    ),
  },
];

export default function About() {
  return (
    <main className="relative min-h-dvh px-5 py-14">
      <div aria-hidden className="starfield pointer-events-none fixed inset-0" />
      <div aria-hidden className="starfield-bright pointer-events-none fixed inset-0" />
      <article className="glass relative mx-auto max-w-[68ch] px-7 py-9 sm:px-10">
        <Link href="/app" className="label-nav text-ink-2 no-underline hover:text-ink">
          ← {shellCopy.backToCase}
        </Link>
        <h1 className="mt-6 text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.05] font-extralight text-silver">
          {shellCopy.productName}
        </h1>
        <p className="mt-5 text-ink-2">
          A guided trend investigation for NASA Space Apps 2026, <em>Be An Earth System Trend Detective!</em>{" "}
          Pick something NASA measures or models, choose places and a period, press Investigate, and see
          whether it is really changing, and how sure we can be. Built by team WOMM.
        </p>

        <Section title="How we test">
          <p>
            Monthly data become <strong className="font-medium text-ink">one value per year</strong> (or per season), because
            neighbouring months are too alike to count as separate evidence. Each region is tested two ways: a
            Mann-Kendall test with the Hamed-Rao correction for year-to-year memory, and a straight-line fit (OLS) whose
            uncertainty is widened for the same memory. A trend is Confirmed only when both tests agree. The slope shown is
            Sen&apos;s slope, a robust median of year-to-year changes, reported per decade.
          </p>
          <dl className="mt-4 grid gap-2">
            {TIERS.map((t) => (
              <div key={t.name} className="rounded-xl border bg-card px-4 py-3">
                <dt className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-medium text-ink">{t.name}</span>
                  <span className="font-mono text-xs text-ink-3">{t.rule}</span>
                </dt>
                <dd className="m-0 mt-1 text-sm">{t.meaning}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4">
            A p-value is not the chance that a trend is real, and a significant trend does not say what caused it.
          </p>
        </Section>

        <Section title="Explanations">
          <p>
            Plain-language explanations and follow-up answers come from Gaia, our AI helper, which runs on Claude (Anthropic). It may only quote numbers our
            statistics engine computed, and physical explanations come from short, cited notes our methods lead wrote.
            The verdict itself never depends on it.
          </p>
        </Section>

        <Section title="Data and attribution">
          <ul className="m-0 grid list-none gap-3 p-0">
            {SOURCES.map((s) => (
              <li key={s.name}>
                <span className="font-medium text-ink">{s.name}.</span> {s.text}
              </li>
            ))}
          </ul>
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 text-ink-2">
      <h2 className="label-mono mb-3 text-silver">{title}</h2>
      {children}
    </section>
  );
}

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-ink underline decoration-hairline-strong underline-offset-2 hover:decoration-silver">
      {children}
    </a>
  );
}
