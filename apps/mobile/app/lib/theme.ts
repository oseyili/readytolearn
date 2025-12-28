import type { AccessibilityPrefs } from "@readytolearn/ui";
import { palette } from "@readytolearn/ui";

export function bg(p: AccessibilityPrefs) { return p.highContrast ? "#000" : palette.bg; }
export function surface(p: AccessibilityPrefs) { return p.highContrast ? "#0a0a0a" : palette.surface; }
export function text(p: AccessibilityPrefs) { return p.highContrast ? "#fff" : palette.text; }
export function muted(p: AccessibilityPrefs) { return p.highContrast ? "#d1d1d1" : palette.textMuted; }
export function font(base: number, p: AccessibilityPrefs) { return p.largeText ? Math.round(base * 1.18) : base; }
