import type { ReactNode } from "react";
import { shellCopy } from "@/lib/copy/globe";
import { Header } from "./Header";

// The instrument: enamel frame, a chart-paper roll for the case (left, fixed
// width) and a dark viewing window for the globe (right). The frame never
// reflows between steps; only what the paper and the window show changes.
// Below 900px the window sits on top and the roll stacks beneath it.
export function AppShell({ panel, globe }: { panel: ReactNode; globe: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-enamel">
      <a
        href="#case-panel"
        className="scale-label sr-only z-20 rounded-sm bg-paper-leaf px-3 py-2 text-ink focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {shellCopy.skipToPanel}
      </a>
      <Header />
      <main className="grid min-h-0 flex-1 grid-rows-[minmax(18rem,55dvh)_auto] gap-(--seam) bg-enamel-seam min-[900px]:grid-cols-[var(--panel-width)_1fr] min-[900px]:grid-rows-1">
        <section
          id="case-panel"
          aria-label="Case"
          className="chart-roll relative order-2 min-h-0 overflow-y-auto overscroll-contain px-5 py-5 pr-9 min-[900px]:order-1"
        >
          {panel}
        </section>
        <section
          aria-label="Globe"
          className="relative order-1 min-h-0 overflow-hidden bg-window text-window-ink shadow-[inset_0_3px_10px_rgb(0_0_0/0.55)] min-[900px]:order-2"
        >
          {globe}
        </section>
      </main>
    </div>
  );
}
