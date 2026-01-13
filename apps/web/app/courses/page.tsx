"use client";

import { useEffect, useMemo, useState } from "react";

type ApiCourse = { id:string; title:string; subject:string; subject_slug:string; level:string; description:string; is_free:boolean };

function colorFor(s: string) {
  const colors = ["#0ea5e9","#22c55e","#a855f7","#f97316","#e11d48","#14b8a6","#6366f1","#f59e0b"];
  let h = 0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i))>>>0;
  return colors[h % colors.length];
}

function getOrCreateLearnerId(): string {
  const key = "rtl_learner_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const gen = (globalThis.crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const v = String(gen);
  localStorage.setItem(key, v);
  return v;
}

function Card({ children }:{ children:React.ReactNode }) {
  return <div style={{ border:"1px solid rgba(0,0,0,.10)", borderRadius:18, padding:16, background:"white", boxShadow:"0 1px 10px rgba(0,0,0,.06)" }}>{children}</div>;
}

export default function CoursesPage() {
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "https://readytolearn-api.onrender.com", []);
  const [items,setItems] = useState<ApiCourse[]>([]);
  const [loading,setLoading] = useState(true);
  const [err,setErr] = useState<string|null>(null);
  const [msg,setMsg] = useState<string|null>(null);
  const [q,setQ] = useState("");

  async function load() {
    try {
      setLoading(true); setErr(null);
      const r = await fetch(`${apiBase}/courses?limit=200&offset=0&q=${encodeURIComponent(q)}`, { cache:"no-store" });
      const j = await r.json().catch(()=> ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setItems(Array.isArray(j.courses)? j.courses : []);
    } catch(e:any) {
      setErr(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [q]);

  async function enroll(courseId: string, title: string) {
    try {
      setMsg(null);
      const learnerId = getOrCreateLearnerId();
      const r = await fetch(`${apiBase}/enroll`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ learnerId, courseId }) });
      const j = await r.json().catch(()=> ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setMsg(`✅ Enrolled: ${title}`);
      setTimeout(() => setMsg(null), 3000);
    } catch(e:any) {
      setMsg(`❌ Enroll failed: ${e?.message || "error"}`);
      setTimeout(() => setMsg(null), 5000);
    }
  }

  async function pay(courseId: string) {
    try {
      setMsg(null);
      const learnerId = getOrCreateLearnerId();
      const r = await fetch(`${apiBase}/payments/create-checkout`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ learnerId, courseId }) });
      const j = await r.json().catch(()=> ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      window.location.href = j.url;
    } catch(e:any) {
      setMsg(`❌ Payment failed: ${e?.message || "error"}`);
      setTimeout(() => setMsg(null), 6000);
    }
  }

  return (
    <div style={{ maxWidth:1150, margin:"0 auto", padding:"28px 16px 60px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div>
          <h1 style={{ margin:0, fontSize:34, fontWeight:900, letterSpacing:-.5 }}>Courses</h1>
          <div style={{ marginTop:8, opacity:.75 }}>Enrol is live. Paid courses go to Stripe Checkout.</div>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <a href="/subjects" style={{ textDecoration:"none" }}>
            <button style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,.14)", background:"white", cursor:"pointer", fontWeight:900 }}>Master Portal</button>
          </a>
        </div>
      </div>

      <div style={{ marginTop:14 }}>
        <Card>
          <input value={q} onChange={(e)=> setQ(e.target.value)} placeholder="Search…" style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1px solid rgba(0,0,0,.14)", outline:"none", fontSize:14 }} />
          <div style={{ marginTop:10, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            {loading ? <span>Loading…</span> : <span>Showing <b>{items.length}</b></span>}
            {err ? <span style={{ color:"crimson" }}>Error: {err}</span> : null}
            {msg ? <span style={{ fontWeight:900 }}>{msg}</span> : null}
          </div>
        </Card>
      </div>

      <div style={{ marginTop:18, display:"grid", gap:14, gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))" }}>
        {items.map(c => {
          const col = colorFor(c.subject_slug || c.subject);
          return (
            <Card key={c.id}>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, padding:"4px 10px", borderRadius:999, background:`${col}18`, color:col, fontWeight:900 }}>{c.subject}</span>
                <span style={{ fontSize:12, padding:"4px 10px", borderRadius:999, border:"1px solid rgba(0,0,0,.12)", background:"rgba(0,0,0,.03)", fontWeight:900 }}>{c.level}</span>
                <span style={{ fontSize:12, padding:"4px 10px", borderRadius:999, border:"1px solid rgba(0,0,0,.12)", background:"rgba(0,0,0,.03)", fontWeight:900 }}>{c.is_free ? "Free" : "Paid"}</span>
              </div>

              <div style={{ marginTop:10, fontSize:16, fontWeight:900, lineHeight:1.2 }}>{c.title}</div>
              <div style={{ marginTop:8, opacity:.82, fontSize:14, lineHeight:1.45 }}>{c.description}</div>

              <div style={{ marginTop:12, display:"flex", gap:10, flexWrap:"wrap" }}>
                <button onClick={()=> enroll(c.id, c.title)} style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,.14)", background:"white", cursor:"pointer", fontWeight:900 }}>Enrol</button>
                {!c.is_free ? (
                  <button onClick={()=> pay(c.id)} style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,.14)", background:"rgba(0,0,0,.04)", cursor:"pointer", fontWeight:900 }}>Pay</button>
                ) : null}
                <a href={`/subjects/${encodeURIComponent(c.subject_slug)}`} style={{ textDecoration:"none" }}>
                  <button style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,.14)", background:"rgba(0,0,0,.04)", cursor:"pointer", fontWeight:900 }}>Subject</button>
                </a>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
