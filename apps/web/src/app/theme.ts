/* ─────────────────────────────────────────────────────────────────────────────
   Theme manager — applies a data-theme attribute on <html> so CSS custom
   properties cascade everywhere.
   ───────────────────────────────────────────────────────────────────────────── */

export type Theme = "standard" | "artifact" | "red-alert" | "premium";

/** Apply a theme to the document root. */
export function applyTheme(theme: Theme): void {
  if (theme === "standard") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

/** Derive the theme from a Day's theme string (server-sent value). */
export function themeFromDay(dayTheme?: string): Theme {
  switch (dayTheme) {
    case "artifact":   return "artifact";
    case "red-alert":  return "red-alert";
    case "premium":    return "premium";
    default:           return "standard";
  }
}
