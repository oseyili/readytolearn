"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, getToken } from "../../../lib/api";

export default function SponsorshipsPortal() {
  const [profile, setProfile] = useState<any>(null);
  const [note, setNote] = useState("");
  const [desiredCourseId, setDesiredCourseId] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const token = getToken();
      if (!token) { setMsg("âŒ Please login first."); return; }
      const p = await apiGet("/user/profile", token);
      setProfile(p.profile);
    } catch (e:any) {
      setMsg("âŒ " + (e?.message || "error"));
    }
  }

  useEffect(()=>{ load(); }, []);

  async function saveProfile() {
    setMsg("");
    try {
      const token = getToken();
      if (!token) { setMsg("âŒ Please login first."); return; }
      await apiPost("/user/profile", profile, token);
      setMsg("âœ… Profile saved.");
    } catch (e:any) { setMsg("âŒ " + (e?.message || "error")); }
  }

  async function apply() {
    setMsg("");
    try {
      const token = getToken();
      if (!token) { setMsg("âŒ Please login first."); return; }
      const body:any = {};
      if (desiredCourseId) body.desiredCourseId = desiredCourseId;
      if (note) body.note = note;
      const r = await apiPost("/sponsorships/apply", body, token);
      setMsg("âœ… Application submitted. You will be matched fairly when sponsorships are available.");
      setNote(""); setDesiredCourseId("");
    } catch (e:any) { setMsg("âŒ " + (e?.message || "error")); }
  }

  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Compassionate Give â€” Learner Support</div>
        <div className="muted">Set your profile and apply for sponsorship (privacy-safe fairness matching).</div>
        <hr />
        {msg && <div className="muted" style={{ whiteSpace:"pre-wrap"  }}>{msg}</div>}

        {!profile && <div className="muted">Loadingâ€¦</div>}
        {profile && (
          <>
            <div className="h2">Your profile (used for fair matching)</div>
            <label>Country</label>
            <input value={profile.country || ""} onChange={(e)=>setProfile({...profile, country:e.target.value})} placeholder="e.g. United Kingdom" />
            <label>Preferred language (ISO code)</label>
            <input value={profile.preferred_language || "en"} onChange={(e)=>setProfile({...profile, preferred_language:e.target.value})} placeholder="en" />
            <label>Accessibility needs (comma separated)</label>
            <input
              value={(profile.accessibility_needs || []).join(", ")}
              onChange={(e)=>setProfile({...profile, accessibility_needs: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) })}
              placeholder="e.g. dyslexia, screen_reader, ASD"
            />
            <label>Economic barrier (true/false)</label>
            <input value={String(!!profile.economic_barrier)} onChange={(e)=>setProfile({...profile, economic_barrier: e.target.value === "true"})} />

            <div className="row" style={{ marginTop:12  }}>
              <button className="btn primary" onClick={saveProfile}>Save profile</button>
            </div>

            <hr />

            <div className="h2">Apply for sponsorship</div>
            <div className="muted">Optional: request a specific course ID (admin can map later).</div>
            <label>Desired course ID (optional)</label>
            <input value={desiredCourseId} onChange={(e)=>setDesiredCourseId(e.target.value)} placeholder="uuid (optional)" />
            <label>Note (optional)</label>
            <input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Tell us what you want to learn" />
            <div className="row" style={{ marginTop:12  }}>
              <button className="btn primary" onClick={apply}>Submit application</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

