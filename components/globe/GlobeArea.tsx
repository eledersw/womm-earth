import { globeCopy } from "@/lib/copy/globe";

// Placeholder viewing window until the globe lands (frontend-shell plan, Task 4).
// Keeps the window's frame, label and graticule so the shell reads finished.
export function GlobeArea() {
  return (
    <div className="relative grid h-full place-items-center">
      <div
        aria-hidden
        className="absolute inset-6 rounded-full opacity-60 [background:repeating-radial-gradient(circle_at_center,transparent_0_47px,var(--window-2)_47px_48px),repeating-conic-gradient(from_0deg,transparent_0_14.5deg,var(--window-2)_14.5deg_15deg)] [mask-image:radial-gradient(closest-side,black_70%,transparent_100%)]"
      />
      <p className="scale-label absolute top-4 left-4 text-window-ink-2">{globeCopy.windowLabel}</p>
      <p className="relative max-w-[28ch] text-center text-window-ink-2">{globeCopy.placeholder}</p>
    </div>
  );
}
