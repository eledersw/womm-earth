import { useEffect } from "react";
// Cross-component UI state (globe <-> panel). SEAM: frozen after H2 — see
// docs/process/OWNERSHIP.md. Case state does NOT live here; it lives in the URL
// (lib/state/use-case.ts).
import { create } from "zustand";

export type HighlightKind = "mirror" | "tour" | null;

export interface Highlight {
  kind: HighlightKind;
  regions: string[];
  /** Region id the globe draws arcs from (mirror view). */
  arcFrom: string | null;
}

export interface Focus {
  lat: number;
  lng: number;
  altitude: number;
}

export interface UiState {
  hoveredRegion: string | null;
  setHoveredRegion: (id: string | null) => void;

  highlight: Highlight;
  setHighlight: (h: Highlight) => void;
  clearHighlight: () => void;

  focus: Focus | null;
  flyTo: (f: Focus) => void;

  /** Predict-before-reveal: while predictMode && !reveal the globe hides trend colours. */
  predictMode: boolean;
  setPredictMode: (on: boolean) => void;
  reveal: boolean;
  setReveal: (revealed: boolean) => void;

  /** How many Gaia requests (explanations, chat answers) are running; the mascot fidgets while > 0. */
  gaiaBusy: number;
  gaiaStart: () => void;
  gaiaEnd: () => void;
}

const NO_HIGHLIGHT: Highlight = { kind: null, regions: [], arcFrom: null };

export const useUiStore = create<UiState>()((set) => ({
  hoveredRegion: null,
  setHoveredRegion: (id) => set({ hoveredRegion: id }),

  highlight: NO_HIGHLIGHT,
  setHighlight: (h) => set({ highlight: h }),
  clearHighlight: () => set({ highlight: NO_HIGHLIGHT }),

  focus: null,
  flyTo: (f) => set({ focus: f }),

  predictMode: false,
  setPredictMode: (on) => set({ predictMode: on }),
  reveal: true,
  setReveal: (revealed) => set({ reveal: revealed }),

  gaiaBusy: 0,
  gaiaStart: () => set((s) => ({ gaiaBusy: s.gaiaBusy + 1 })),
  gaiaEnd: () => set((s) => ({ gaiaBusy: Math.max(0, s.gaiaBusy - 1) })),
}));

/** Marks Gaia as working while `active` is true (for the mascot). */
export function useGaiaWorking(active: boolean) {
  useEffect(() => {
    if (!active) return;
    useUiStore.getState().gaiaStart();
    return () => useUiStore.getState().gaiaEnd();
  }, [active]);
}
