"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, getToken } from "../../../../lib/api";

export default function AdminSponsorships() {
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    try {
      const token = getToken();
      if (!token) { setMsg("❌ Please login first."); return; }
      const s = await apiGet("/admin/sponsorships/paid", token);
      const a = await apiGet("/admin/sponsorships/applications", token);
      setSponsorships(s.sponsorships || []);
      setApplications(a.applications || []);
    } catch (e:any) {
      setMsg("❌ " + (e?.message || "error"));
    }
  }

  async function allocate(sponsorshipId: string, recipientUserId: string, courseId?: string) {
    setMsg("");
    try {
      const token = getToken();
      if (!token) { setMsg("❌ Please login first."); return; }
      await apiPost("/admin/sponsorships/allocate", { sponsorshipId, recipientUserId, courseId }, token);
      setMsg("✅ Allocated sponsorship to learner.");
      await load();
    } catch (e:any) {
      setMsg("❌ " + (e?.message || "error"));
    }
  }

  useEffect(()=>{ load(); }, []);

  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Admin — Sponsorship Review</div>
        <div className="muted">Use this if SPONSORSHIP_AUTO_ALLOCATE=false or for manual oversight.</div>
        <hr />
        {msg && <div className="muted" style={{whiteSpace:"pre-wrap"}}>{msg}</div>}
        <div className="row" style={{marginTop:12}}>
          <button className="btn" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="card col-6">
        <div className="h2">Paid sponsorships</div>
        <div className="muted">Most recent first.</div>
        <hr />
        {sponsorships.map((s)=>(
          <div key={s.id} className="card" style={{background:"var(--surface2)", marginBottom:10}}>
            <div className="row" style={{justifyContent:"space-between"}}>
              <div><b>{s.kind}</b> • {s.currency?.toUpperCase()} • {Math.round((s.amount_cents||0)/100)}</div>
              <span className="badge">{new Date(s.created_at).toLocaleString()}</span>
            </div>
            <div className="muted">ID: {s.id}</div>
          </div>
        ))}
        {sponsorships.length===0 && <div className="muted">No paid sponsorships yet.</div>}
      </div>

      <div className="card col-6">
        <div className="h2">Pending applications</div>
        <div className="muted">Oldest first. Manual allocation uses the first paid sponsorship + each application.</div>
        <hr />
        {applications.map((a)=>(
          <div key={a.id} className="card" style={{background:"var(--surface2)", marginBottom:10}}>
            <div className="row" style={{justifyContent:"space-between"}}>
              <div><b>{a.email}</b></div>
              <span className="badge">{new Date(a.created_at).toLocaleString()}</span>
            </div>
            <div className="muted">Country: {a.country || "Unknown"} • Lang: {a.preferred_language || "en"}</div>
            <div className="muted">Accessibility: {(a.accessibility_needs||[]).join(", ") || "None"} • Economic barrier: {String(!!a.economic_barrier)}</div>
            <div className="muted">Desired course: {a.desired_course_id || "None"}</div>
            <div className="row" style={{marginTop:10}}>
              <button
                className="btn primary"
                onClick={()=>allocate((sponsorships[0]||{}).id, a.user_id, a.desired_course_id || undefined)}
                disabled={!sponsorships[0]}
              >
                Allocate using newest sponsorship
              </button>
            </div>
          </div>
        ))}
        {applications.length===0 && <div className="muted">No pending applications.</div>}
      </div>
    </div>
  );
}
