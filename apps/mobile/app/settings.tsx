import React, { useEffect, useState } from "react";
import { View, Text, Switch, Pressable } from "react-native";
import type { AccessibilityPrefs, Role } from "@readytolearn/ui";
import { defaultPrefs } from "@readytolearn/ui";
import { loadPrefs, savePrefs, loadRole, saveRole } from "./lib/prefs";
import { bg, surface, text, muted, font } from "./lib/theme";

const roles: Role[] = ["learner","supporter","employer","admin","investor"];

export default function Settings() {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(defaultPrefs);
  const [role, setRole] = useState<Role>("learner");

  useEffect(() => {
    Promise.all([loadPrefs(), loadRole()]).then(([p, r]) => { setPrefs(p); setRole(r); });
  }, []);

  async function update(next: AccessibilityPrefs) { setPrefs(next); await savePrefs(next); }
  async function setDemoRole(r: Role) { setRole(r); await saveRole(r); }

  return (
    <View style={{ flex: 1, backgroundColor: bg(prefs), padding: 16 }}>
      <View style={{ backgroundColor: surface(prefs), borderRadius: 18, padding: 16 }}>
        <Text style={{ color: text(prefs), fontSize: font(24, prefs), fontWeight: "800" }}>Accessibility</Text>
        <Text style={{ color: muted(prefs), marginTop: 8, fontSize: font(16, prefs) }}>
          One-tap modes that reduce cognitive load and improve inclusion.
        </Text>

        {[
          ["Simple Mode","simpleMode"],
          ["Focus Mode","focusMode"],
          ["Audio-First","audioFirst"],
          ["High Contrast","highContrast"],
          ["Large Text","largeText"],
        ].map(([label, key]) => (
          <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <Text style={{ color: text(prefs), fontSize: font(16, prefs) }}>{label}</Text>
            <Switch value={(prefs as any)[key]} onValueChange={(v)=>update({ ...prefs, [key]: v } as AccessibilityPrefs)} />
          </View>
        ))}

        <Pressable onPress={() => update(defaultPrefs)} style={{ marginTop: 16, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }}>
          <Text style={{ color: text(prefs), fontSize: font(16, prefs), fontWeight: "700" }}>Reset</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 14, backgroundColor: surface(prefs), borderRadius: 18, padding: 16 }}>
        <Text style={{ color: text(prefs), fontSize: font(18, prefs), fontWeight: "800" }}>Role (Demo)</Text>
        <Text style={{ color: muted(prefs), marginTop: 6, fontSize: font(16, prefs) }}>
          Pick a portal role to preview dashboards.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
          {roles.map((r) => (
            <Pressable key={r} onPress={() => setDemoRole(r)} style={{
              paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999,
              borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
              backgroundColor: role === r ? "rgba(41,182,246,0.16)" : "transparent",
              marginRight: 10, marginBottom: 10
            }}>
              <Text style={{ color: text(prefs), fontSize: font(14, prefs), fontWeight: "700" }}>{r}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
