// Colour schemes for the Silver Orbit world. The active one lives on
// <html data-theme>; the choice persists per browser. Pure module (no React),
// so the server layout can embed the restore script.

export const THEMES = ["silver", "nebula", "ember"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "silver";
export const THEME_STORAGE_KEY = "ecf-theme";
/** Fired on window after the theme changes, for code that can't read CSS live (three.js). */
export const THEME_EVENT = "ecf-themechange";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export function currentTheme(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const value = document.documentElement.dataset.theme;
  return isTheme(value) ? value : DEFAULT_THEME;
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the theme still applies for this visit.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

/** Runs before first paint so a returning visitor never sees the wrong scheme flash. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(${JSON.stringify(THEMES)}.indexOf(t)>-1)document.documentElement.dataset.theme=t}catch(e){}`;
