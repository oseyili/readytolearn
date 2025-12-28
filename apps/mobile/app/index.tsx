import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { AccessibilityPrefs, Role } from "@readytolearn/ui";
import { defaultPrefs } from "@readytolearn/ui";
import { loadPrefs, loadRole } from "./lib/prefs";
import { bg, surface, text, muted, font } from "./lib/theme";

function roleGreeting(role: Role) {
  switch (role) {
    case "learner": return "Today’s Focus";
    case "supporter": return "Learner Support Overview";
    case "employer": return "Talent Pipeline Overview";
    case "admin": return "System Health Overview";
    case "investor": return "Performance Overview";
  }
}

export default function Home() {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(defaultPrefs);
  const [role, setRole] = useState<Role>("learner");

  useEffect(() => {
    Promise.all([loadPrefs(), loadRole()]).then(([p, r]) => { setPrefs(p); setRole(r); });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: bg(prefs), padding: 16 }}>
      <View style={{ backgroundColor: surface(prefs), borderRadius: 18, padding: 16 }}>
        <Text style={{ color: muted(prefs), fontSize: font(14, prefs) }}>Role: {role}</Text>
        <Text style={{ color: text(prefs), fontSize: font(26, prefs), fontWeight: "800", marginTop: 6 }}>
          {roleGreeting(role)}
        </Text>
        <Text style={{ color: muted(prefs), marginTop: 10, fontSize: font(16, prefs) }}>
          Calm, simple layout. SEN-friendly. No timers. Pause anytime.
        </Text>
      </View>

      <View style={{ marginTop: 14, backgroundColor: surface(prefs), borderRadius: 18, padding: 16 }}>
        <Text style={{ color: text(prefs), fontSize: font(18, prefs), fontWeight: "800" }}>AI Guide</Text>
        <Text style={{ color: muted(prefs), marginTop: 6, fontSize: font(16, prefs) }}>
          Ask anything. Choose text or voice. Switch language anytime.
        </Text>
        <Pressable style={{ marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: "rgba(41,182,246,0.16)" }}>
          <Text style={{ color: text(prefs), fontSize: font(16, prefs), fontWeight: "700" }}>Open Tutor</Text>
        </Pressable>
      </View>
    </View>
  );
}
