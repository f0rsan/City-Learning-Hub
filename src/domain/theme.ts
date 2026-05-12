export type ThemeMode = "light" | "dark";

const themeStorageKey = "shenzhen-learning-hub:theme-mode";

function prefersDarkMode() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(themeStorageKey);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return prefersDarkMode() ? "dark" : "light";
}

export function applyThemeMode(mode: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = mode;
}

export function persistThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(themeStorageKey, mode);
}
