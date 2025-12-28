export type Role = "learner" | "supporter" | "employer" | "admin" | "investor";

export type AccessibilityPrefs = {
  simpleMode: boolean;
  focusMode: boolean;
  audioFirst: boolean;
  highContrast: boolean;
  largeText: boolean;
};
