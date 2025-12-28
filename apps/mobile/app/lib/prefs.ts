import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AccessibilityPrefs, Role } from "@readytolearn/ui";
import { defaultPrefs } from "@readytolearn/ui";

const PREF_KEY = "rtl_accessibility_prefs_v1";
const ROLE_KEY = "rtl_demo_role_v1";

export async function loadPrefs(): Promise<AccessibilityPrefs> {
  const raw = await AsyncStorage.getItem(PREF_KEY);
  return raw ? (JSON.parse(raw) as AccessibilityPrefs) : defaultPrefs;
}
export async function savePrefs(p: AccessibilityPrefs) {
  await AsyncStorage.setItem(PREF_KEY, JSON.stringify(p));
}

export async function loadRole(): Promise<Role> {
  const raw = await AsyncStorage.getItem(ROLE_KEY);
  return (raw as Role) ?? "learner";
}
export async function saveRole(r: Role) {
  await AsyncStorage.setItem(ROLE_KEY, r);
}
