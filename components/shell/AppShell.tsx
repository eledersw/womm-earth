import type { ReactNode } from "react";
import { shellCopy } from "@/lib/copy/globe";
import { Header } from "./Header";

// Silver Orbit: the globe floats in open space and the case sits on a pane of
// liquid glass beside it. From 900px the globe fills the screen (offset right
// so it clears the panel) and everything else floats over it; below 900px the
// globe sits on top and the glass panel stacks beneath it.
export function AppShell({ panel, globe }: { panel: ReactNode; globe: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background min-[900px]:h-dvh min-[900px]:overflow-hidden">
      <div aria-hidden className="starfield pointer-events-none fixed inset-0" />
      <div aria-hidden className="starfield-bright pointer-events-none fixed inset-0" />

      <a
        href="#case-panel"
        className="label-nav sr-only z-30 rounded-lg bg-silver px-3 py-2 text-space focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        {shellCopy.skipToPanel}
      </a>

      <Header />

      <section
        aria-label="Globe"
        className="relative h-[58dvh] shrink-0 min-[900px]:absolute min-[900px]:inset-y-0 min-[900px]:right-0 min-[900px]:left-[calc(var(--panel-width)*0.5)] min-[900px]:h-auto"
      >
        {globe}
      </section>

      <section
        id="case-panel"
        aria-label="Case"
        className="glass relative z-10 mx-3 mb-3 flex flex-col min-[900px]:absolute min-[900px]:top-(--header-height) min-[900px]:bottom-6 min-[900px]:left-6 min-[900px]:m-0 min-[900px]:w-(--panel-width)"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 [scrollbar-gutter:stable] [scrollbar-width:thin]">
          {panel}
        </div>
      </section>
    </div>
  );
}
