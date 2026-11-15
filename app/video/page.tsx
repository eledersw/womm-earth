import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Download } from "lucide-react";
import { landingCopy as c } from "@/lib/copy/landing";

const v = c.video;
export const metadata: Metadata = {
  title: v.title,
  description: v.body,
  openGraph: { title: v.title, description: v.body, type: "video.other", videos: [{ url: v.src, type: "video/mp4", width: 1920, height: 1080 }], images: [v.poster] },
};

// The submission video, with sound. Same Silver Orbit look as the landing page.
export default function VideoPage() {
  return (
    <div className="relative min-h-dvh bg-space text-ink">
      <div aria-hidden className="starfield pointer-events-none fixed inset-0" />
      <div aria-hidden className="starfield-bright pointer-events-none fixed inset-0" />
      <header className="relative px-4 pt-4 sm:px-6">
        <nav aria-label="Main" className="glass-pill mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 rounded-2xl pr-3 pl-5">
          <Link href="/" className="shrink-0 no-underline">
            <Image src="/womm-earth-logo-dark-mode.svg" alt="WOMM Earth" width={206} height={27} priority className="h-6 w-auto sm:h-7" />
          </Link>
          <Link href="/app" className="inline-flex h-10 items-center gap-3 rounded-xl bg-[linear-gradient(180deg,var(--action-top),var(--action-bottom))] px-5 font-mono text-[0.8rem] tracking-[0.16em] text-(--action-ink) uppercase no-underline shadow-[inset_0_1px_0_rgb(255_255_255/0.8),inset_0_-1px_0_rgb(0_0_0/0.2)] hover:brightness-[1.07]">
            {c.launch}<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
          </Link>
        </nav>
      </header>
      <main className="relative mx-auto max-w-[1320px] px-5 pt-14 pb-24 sm:px-8 lg:pt-20">
        <h1 className="text-[clamp(2.2rem,4.6vw,3.8rem)] leading-[1.05] font-extralight tracking-[-0.03em] text-ink">{v.heading}</h1>
        <p className="mt-5 max-w-[60ch] text-[1.15rem] leading-[1.6] text-ink-2">{v.body}</p>
        <div className="glass relative mt-10 p-1.5 shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9)]">
          {/* Sound on: no autoplay, so the browser lets it play with audio when pressed. */}
          <video src={v.src} poster={v.poster} controls playsInline preload="metadata" aria-label={v.heading}
            className="block aspect-video w-full rounded-[calc(var(--radius-panel)-6px)] bg-space" />
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <a href={v.src} download className="glass-pill label-nav inline-flex h-11 items-center gap-2 rounded-xl px-5 text-ink no-underline hover:text-silver">
            <Download aria-hidden className="size-4" strokeWidth={1.75} />{v.download}
          </a>
          <Link href="/" className="label-nav text-ink-2 no-underline hover:text-ink">{v.back}</Link>
        </div>
      </main>
    </div>
  );
}
