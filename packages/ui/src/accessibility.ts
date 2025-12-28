import type { AccessibilityPrefs } from "./types";

export const defaultPrefs: AccessibilityPrefs = {
  simpleMode: false,
  focusMode: false,
  audioFirst: false,
  highContrast: false,
  largeText: false,
};

export function applyWebPrefs(prefs: AccessibilityPrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.simpleMode = String(prefs.simpleMode);
  root.dataset.focusMode = String(prefs.focusMode);
  root.dataset.audioFirst = String(prefs.audioFirst);
  root.dataset.highContrast = String(prefs.highContrast);
  root.dataset.largeText = String(prefs.largeText);
}
