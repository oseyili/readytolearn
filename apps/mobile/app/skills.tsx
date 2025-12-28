import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import type { AccessibilityPrefs } from "@readytolearn/ui";
import { defaultPrefs } from "@readytolearn/ui";
import { loadPrefs } from "./lib/prefs";
import { bg, surface, text, muted, font } from "./lib/theme";

export default function Screen() {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(defaultPrefs);
  useEffect(() => { loadPrefs().then(setPrefs); }, []);
  return (
    <View style={{ flex: 1, backgroundColor: bg(prefs), padding: 16 }}>
      <View style={{ backgroundColor: surface(prefs), borderRadius: 18, padding: 16 }}>
        <Text style={{ color: text(prefs), fontSize: font(24, prefs), fontWeight: "800" }}>My Skills</Text>
        <Text style={{ color: muted(prefs), marginTop: 8, fontSize: font(16, prefs) }}>Skill Passport: evidence-backed, verifiable, employer-readable.</Text>
      </View>
    </View>
  );
}
