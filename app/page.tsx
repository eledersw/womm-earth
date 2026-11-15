import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Play } from "lucide-react";
import { LandingVideo } from "@/components/landing/LandingVideo";
import { GaiaMascot } from "@/components/partner/GaiaMascot";
import { landingCopy as c } from "@/lib/copy/landing";

export const metadata: Metadata = { title: c.title, description: c.description };

// The landing page uses the app's own Silver Orbit system: the starfield, glass
// frames, thin Stack Sans Headline, Fragment Mono labels and the chrome button.
export default function Landing() {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-space text-ink">
      <div aria-hidden className="starfield pointer-events-none fixed inset-0" />
      <div aria-hidden className="starfield-bright pointer-events-none fixed inset-0" />

      <Nav />

      <main className="relative">
        <Hero />
        <Demo />
        <Questions />
        <Steps />
        <Evidence />
        <Gaia />
        <Data />
        <Impact />
        <Built />
        <Team />
        <Final />
      </main>

      <Footer />
    </div>
  );
}

function LaunchButton({ size = "hero" }: { size?: "hero" | "nav" }) {
  const big = size === "hero";
  return (
    <Link
      href="/app"
      className={`group inline-flex items-center justify-center gap-3 rounded-2xl font-mono uppercase no-underline text-(--action-ink) whitespace-nowrap
        bg-[linear-gradient(180deg,var(--action-top),var(--action-bottom))]
        shadow-[inset_0_1px_0_rgb(255_255_255/0.8),inset_0_-1px_0_rgb(0_0_0/0.2),0_18px_44px_-16px_rgb(0_0_0/0.95)]
        transition-[filter,transform] duration-200 ease-out hover:brightness-[1.07] active:translate-y-px
        focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-silver
        ${big ? "h-[4.75rem] px-12 text-[1.35rem] tracking-[0.14em] sm:h-[5.5rem] sm:px-16 sm:text-[1.6rem]" : "h-10 rounded-xl px-5 text-[0.8rem] tracking-[0.16em]"}`}
    >
      {c.launch}
      <ArrowRight aria-hidden className={`${big ? "size-7" : "size-4"} transition-transform duration-200 ease-out group-hover:translate-x-1`} strokeWidth={1.75} />
    </Link>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
      <nav aria-label="Main" className="glass-pill mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 rounded-2xl pr-3 pl-5">
        <Link href="/" className="shrink-0 no-underline">
          <Image src="/womm-earth-logo-dark-mode.svg" alt="WOMM Earth" width={206} height={27} priority className="h-6 w-auto sm:h-7" />
        </Link>
        <ul className="m-0 hidden list-none items-center gap-7 p-0 lg:flex">
          {c.nav.map((item) => (
            <li key={item.href}><a href={item.href} className="label-nav text-ink-2 no-underline transition-colors hover:text-ink">{item.label}</a></li>
          ))}
          <li><a href={c.githubUrl} className="label-nav inline-flex items-center gap-1 text-ink-2 no-underline transition-colors hover:text-ink">{c.github}<ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} /></a></li>
        </ul>
        <LaunchButton size="nav" />
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-[1320px] items-center gap-12 px-5 pt-14 pb-20 sm:px-8 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)] lg:pt-10 lg:pb-24">
      <div className="landing-rise">
        <Image src="/womm-earth-logo-dark-mode.svg" alt="" width={206} height={27} className="h-9 w-auto sm:h-11" />
        <h1 className="mt-9 text-[clamp(2.9rem,5.1vw,4.7rem)] leading-[1.04] font-extralight tracking-[-0.035em] lg:whitespace-nowrap text-ink [text-wrap:balance]">
          {c.hero.lines[0]}<br />
          <span className="text-silver">{c.hero.lines[1]}</span>
        </h1>
        <p className="mt-7 max-w-[34ch] text-[1.3rem] leading-[1.5] text-ink-2">{c.hero.sub}</p>
        <div className="mt-11 flex flex-wrap items-center gap-x-8 gap-y-5">
          <LaunchButton />
          <a href="#demo" className="label-nav inline-flex items-center gap-2.5 text-ink-2 no-underline transition-colors hover:text-ink">
            <span className="glass-pill grid size-10 place-items-center rounded-full"><Play aria-hidden className="size-4 fill-current" strokeWidth={1.5} /></span>
            {c.watch}
          </a>
        </div>
      </div>
      <div className="landing-rise-late relative">
        <Frame>
          <Image src="/landing/01-case.jpg" alt={c.hero.shotAlt} width={1920} height={1080} priority sizes="(min-width: 1024px) 58vw, 100vw" className="block h-auto w-full rounded-[calc(var(--radius-panel)-6px)]" />
        </Frame>
      </div>
    </section>
  );
}

/** A liquid-glass frame around real product media, like the app's panes. */
function Frame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass relative p-1.5 shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9)] ${className}`}>{children}</div>;
}

function SectionHead({ title, body, id }: { title: string; body?: string; id?: string }) {
  return (
    <div className="max-w-[46rem]">
      <h2 id={id} className="text-[clamp(2.1rem,4.2vw,3.4rem)] leading-[1.06] font-extralight tracking-[-0.03em] text-ink [text-wrap:balance]">{title}</h2>
      {body ? <p className="mt-5 max-w-[60ch] text-[1.15rem] leading-[1.6] text-ink-2">{body}</p> : null}
    </div>
  );
}

function Demo() {
  return (
    <section id="demo" aria-labelledby="demo-title" className="mx-auto max-w-[1320px] scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <SectionHead id="demo-title" title={c.demo.title} body={c.demo.body} />
      <Frame className="mt-12">
        <LandingVideo src="/landing/womm-earth-demo.mp4" poster="/landing/demo-poster.jpg" label={c.demo.title} />
      </Frame>
    </section>
  );
}

function Questions() {
  return (
    <section aria-labelledby="questions-title" className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 lg:py-28">
      <h2 id="questions-title" className="max-w-[18ch] text-[clamp(2.1rem,4.2vw,3.4rem)] leading-[1.06] font-extralight tracking-[-0.03em] text-ink">{c.questions.title}</h2>
      <ul className="m-0 mt-12 list-none space-y-2 p-0 lg:ml-[18%]">
        {c.questions.items.map((q) => (
          <li key={q} className="font-display text-[clamp(1.7rem,3.6vw,3rem)] leading-[1.15] font-extralight tracking-[-0.02em] text-silver">{q}</li>
        ))}
      </ul>
      <p className="mt-12 max-w-[62ch] text-[1.15rem] leading-[1.6] text-ink-2 lg:ml-[18%]">{c.questions.body}</p>
    </section>
  );
}

function Steps() {
  return (
    <section id="how" aria-labelledby="how-title" className="mx-auto max-w-[1320px] scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <SectionHead id="how-title" title={c.steps.title} body={c.steps.body} />
      <ol className="m-0 mt-14 grid list-none gap-x-6 gap-y-10 p-0 sm:grid-cols-2 lg:grid-cols-5">
        {c.steps.items.map((s, i) => (
          <li key={s.name} className="border-t border-hairline-strong pt-6">
            <p className="figure text-[2.6rem]">{i + 1}</p>
            <h3 className="mt-5 text-[1.5rem] font-light tracking-[-0.01em] text-ink">{s.name}</h3>
            <p className="label-mono mt-2 text-ink-3">{s.what}</p>
            <p className="mt-4 leading-[1.55] text-ink-2">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Shot({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} width={1920} height={1080} sizes="(min-width: 1024px) 40vw, 100vw" className="block h-auto w-full rounded-[calc(var(--radius-panel)-8px)]" />;
}

function Evidence() {
  const e = c.evidence;
  return (
    <section id="evidence" aria-labelledby="evidence-title" className="mx-auto max-w-[1320px] scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <SectionHead id="evidence-title" title={e.title} />
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <figure className="glass relative m-0 p-1.5 lg:col-span-2">
          <Shot src="/landing/02b-evidence.jpg" alt={e.chartAlt} />
        </figure>
        <div className="glass relative flex flex-col p-7">
          <h3 className="text-[1.45rem] font-light text-ink">{e.tests.title}</h3>
          <p className="mt-4 leading-[1.6] text-ink-2">{e.tests.body}</p>
          <dl className="mt-auto grid gap-4 pt-8">
            {e.tiers.map((t) => (
              <div key={t.name}>
                <dt className="label-mono text-silver">{t.name}</dt>
                <dd className="m-0 mt-1.5 text-[0.95rem] leading-[1.5] text-ink-2">{t.text}</dd>
              </div>
            ))}
          </dl>
        </div>
        {[e.correlation, e.radar].map((card, i) => (
          <figure key={card.title} className={`glass relative m-0 flex flex-col p-1.5 ${i === 1 ? "lg:col-span-2" : ""}`}>
            <Shot src={i === 0 ? "/landing/03b-corr.jpg" : "/landing/04c-radar.jpg"} alt={card.alt} />
            <figcaption className="px-5 pt-5 pb-5">
              <span className="text-[1.25rem] font-light text-ink">{card.title}</span>
              <span className="mt-1.5 block leading-[1.55] text-ink-2">{card.text}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Gaia() {
  const g = c.gaia;
  return (
    <section id="gaia" aria-labelledby="gaia-title" className="mx-auto grid max-w-[1320px] scroll-mt-24 items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:py-28">
      <div className="relative order-2 pt-16 lg:order-1">
        {/* Gaia perches on the frame, as it sits on its pane in the app. */}
        <div className="absolute top-0 right-10 z-10"><GaiaMascot scale={2.2} /></div>
        <Frame>
          <Shot src="/landing/05b-gaia-answer.jpg" alt={g.alt} />
        </Frame>
      </div>
      <div className="order-1 lg:order-2">
        <SectionHead id="gaia-title" title={g.title} body={g.body} />
        <ol className="m-0 mt-8 grid list-none gap-5 p-0">
          {g.rules.map((r, i) => (
            <li key={r} className="flex gap-5">
              <span className="figure w-6 shrink-0 text-[1.9rem]">{i + 1}</span>
              <span className="pt-1 text-[1.15rem] leading-[1.55] text-ink">{r}</span>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-[58ch] leading-[1.6] text-ink-2">{g.cards}</p>
        <p className="mt-4 max-w-[58ch] leading-[1.6] text-ink-2">{g.verdict}</p>
      </div>
    </section>
  );
}

function Data() {
  const d = c.data;
  return (
    <section aria-labelledby="data-title" className="mx-auto grid max-w-[1320px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:py-28">
      <SectionHead id="data-title" title={d.title} body={d.body} />
      <dl className="m-0 grid content-start gap-9">
        {d.rows.map((r) => (
          <div key={r.name} className="border-t border-hairline-strong pt-6">
            <dt className="text-[1.35rem] font-light text-ink">{r.name}</dt>
            <dd className="m-0 mt-2.5 max-w-[60ch] leading-[1.6] text-ink-2">{r.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Impact() {
  const m = c.impact;
  return (
    <section aria-labelledby="impact-title" className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 lg:py-28">
      <SectionHead id="impact-title" title={m.title} />
      <p className="mt-10 max-w-[30ch] font-display text-[clamp(1.5rem,2.6vw,2.1rem)] leading-[1.3] font-extralight tracking-[-0.015em] text-silver">{m.lead}</p>
      <div className="mt-14 grid gap-10 md:grid-cols-2 lg:ml-[18%]">
        {m.items.map((it) => (
          <div key={it.name}>
            <h3 className="text-[1.35rem] font-light text-ink">{it.name}</h3>
            <p className="mt-3 max-w-[52ch] leading-[1.6] text-ink-2">{it.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Built() {
  const b = c.built;
  return (
    <section id="built" aria-labelledby="built-title" className="mx-auto max-w-[1320px] scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <SectionHead id="built-title" title={b.title} body={b.body} />
      <ul className="m-0 mt-9 flex list-none flex-wrap gap-2.5 p-0">
        {b.stack.map((t) => (
          <li key={t} className="glass-pill rounded-full px-4 py-2 font-mono text-[0.85rem] text-ink-2">{t}</li>
        ))}
      </ul>
      <div className="mt-14 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h3 className="text-[1.6rem] font-light text-ink">{b.graphTitle}</h3>
          <p className="mt-2 max-w-[56ch] leading-[1.6] text-ink-2">{b.graphBody}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/graph/project-graph.html" className="glass-pill label-nav inline-flex h-11 items-center gap-2 rounded-xl px-5 text-ink no-underline hover:text-silver">
            {b.graphOpen}<ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
          </a>
          <a href={c.githubUrl} className="glass-pill label-nav inline-flex h-11 items-center gap-2 rounded-xl px-5 text-ink no-underline hover:text-silver">
            {c.github}<ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
          </a>
        </div>
      </div>
      <Frame className="mt-8">
        <iframe src="/graph/project-graph.html" title={b.graphFrame} loading="lazy"
          className="block h-[min(72dvh,720px)] w-full rounded-[calc(var(--radius-panel)-6px)] border-0 bg-space" />
      </Frame>
    </section>
  );
}

function Team() {
  const t = c.team;
  return (
    <section id="team" aria-labelledby="team-title" className="mx-auto max-w-[1320px] scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <SectionHead id="team-title" title={t.title} body={t.body} />
      <ul className="m-0 mt-14 grid list-none gap-x-6 gap-y-10 p-0 sm:grid-cols-2 lg:grid-cols-5">
        {t.people.map((p) => (
          <li key={p.name} className="border-t border-hairline-strong pt-6">
            <p className="font-display text-[1.75rem] leading-[1.1] font-extralight tracking-[-0.02em] text-ink">{p.name}</p>
            <p className="label-mono mt-3 text-ink-3">{p.role}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Final() {
  return (
    <section aria-labelledby="final-title" className="mx-auto max-w-[1320px] px-5 pt-16 pb-28 sm:px-8">
      <div className="glass relative flex flex-col items-center px-6 py-20 text-center sm:py-24">
        <Image src="/womm-earth-mark-dark-mode.svg" alt="" width={78} height={60} className="h-14 w-auto" />
        <h2 id="final-title" className="mt-8 text-[clamp(2.2rem,4.6vw,3.8rem)] leading-[1.05] font-extralight tracking-[-0.03em] text-ink">{c.final.title}</h2>
        <div className="mt-11"><LaunchButton /></div>
      </div>
    </section>
  );
}

function Footer() {
  const f = c.footer;
  return (
    <footer className="relative border-t border-hairline">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-5 py-10 sm:px-8">
        <Image src="/womm-earth-logo-dark-mode.svg" alt="WOMM Earth" width={206} height={27} className="h-6 w-auto" />
        <ul className="m-0 flex list-none flex-wrap items-center gap-x-8 gap-y-3 p-0">
          <li className="label-nav text-ink-3">{f.event}</li>
          <li className="label-nav text-ink-3">{f.data}</li>
          <li><Link href="/about" className="label-nav text-ink-2 no-underline hover:text-ink">{f.attribution}</Link></li>
          <li><a href={c.githubUrl} className="label-nav text-ink-2 no-underline hover:text-ink">{c.github}</a></li>
        </ul>
      </div>
    </footer>
  );
}
