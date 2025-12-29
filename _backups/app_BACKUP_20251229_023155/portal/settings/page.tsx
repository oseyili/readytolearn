"use client";

import { useEffect, useState } from "react";
import { AccessibilityPrefs, defaultPrefs, applyWebPrefs } from "@readytolearn/ui";

const KEY = "rtl_accessibility_prefs_v1";

export default function Settings() {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(defaultPrefs);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    const loaded = raw ? (JSON.parse(raw) as AccessibilityPrefs) : defaultPrefs;
    setPrefs(loaded);
    applyWebPrefs(loaded);
  }, []);

  function update(next: AccessibilityPrefs) {
    setPrefs(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    applyWebPrefs(next);
  }

  return (
    <div className="card">
      <div className="h1">Accessibility & Learning Preferences</div>
      <div className="muted">One-tap modes that reduce cognitive load and improve inclusion.</div>
      <hr />
      <div className="grid">
        <div className="col-6 card" style={{ background:"var(--surface2)"  }}>
          <div className="h2">One-tap modes</div>
          <label><input type="checkbox" checked={prefs.simpleMode} onChange={(e)=>update({...prefs, simpleMode:e.target.checked})}/>Simple Mode</label>
          <label><input type="checkbox" checked={prefs.focusMode} onChange={(e)=>update({...prefs, focusMode:e.target.checked})}/>Focus Mode</label>
          <label><input type="checkbox" checked={prefs.audioFirst} onChange={(e)=>update({...prefs, audioFirst:e.target.checked})}/>Audio-First</label>
        </div>
        <div className="col-6 card" style={{ background:"var(--surface2)"  }}>
          <div className="h2">Visual comfort</div>
          <label><input type="checkbox" checked={prefs.highContrast} onChange={(e)=>update({...prefs, highContrast:e.target.checked})}/>High Contrast</label>
          <label><input type="checkbox" checked={prefs.largeText} onChange={(e)=>update({...prefs, largeText:e.target.checked})}/>Large Text</label>
          <button className="btn" style={{ marginTop:12  }} onClick={()=>update(defaultPrefs)}>Reset</button>
        </div>
      </div>
    </div>
  );
}

