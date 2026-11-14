"use client";

import { useSyncExternalStore } from "react";
import { shellCopy } from "@/lib/copy/globe";
import { DEFAULT_THEME, THEME_EVENT, THEMES, applyTheme, currentTheme } from "./theme";

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

// Fragment's language pill (EN | PL), here choosing the colour scheme.
export function ThemeSwitch() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => DEFAULT_THEME);

  return (
    <div
      role="group"
      aria-label={shellCopy.themeLabel}
      className="flex items-center gap-0.5 rounded-full border border-hairline-strong p-1"
    >
      {THEMES.map((t) => {
        const active = t === theme;
        return (
          <button
            key={t}
            type="button"
            aria-pressed={active}
            onClick={() => applyTheme(t)}
            className={`label-nav h-8 rounded-full px-3 transition-colors duration-200 ${
              active ? "bg-silver text-space" : "text-ink-3 hover:text-ink"
            }`}
          >
            {shellCopy.themes[t]}
          </button>
        );
      })}
    </div>
  );
}
