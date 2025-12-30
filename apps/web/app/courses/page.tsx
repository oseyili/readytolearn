"use client";

import { useEffect, useMemo, useState } from "react";

type ApiCourse = {
  id: string;
  title: string;
  subject?: string;
  level?: string;
  description?: string;
  is_free?: boolean;
};

function getOrCreateLearnerId(): string {
  const key = "rtl_learner_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const generated = (globalThis.crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const v = String(generated);
  localStorage.setItem(key, v);
  return v;
}

function hashColor(input: string) {
  const colors = ["#0ea5e9","#22c55e","#a855f7","#f97316","#e11d48","#14b8a6","#6366f1","#f59e0b"];
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ fontSize:12, padding:"4px 10px", borderRadius:999, border:"1px solid rgba(0,0,0,0.12)", background: color ? `${color}14` : "rgba(0,0,0,0.03)", color: color || "inherit", whiteSpace:"nowrap", fontWeight:900 }}>
      {children}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border:"1px solid rgba(0,0,0,0.10)", borderRadius:18, padding:16, background:"white", boxShadow:"0 1px 10px rgba(0,0,0,0.05)" }}>
      {children}
    </div>
  );
}

export default function CoursesPage() {
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "https://readytolearn-api.onrender.com", []);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    try {
      setLoading(true); setErr(null);
      const res = await fetch(`${apiBase}/courses?limit=5000&offset=0&q=${encodeURIComponent(q)}`, { cache:"no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setCourses(Array.isArray(data.courses) ? data.courses : []);
    } catch (e:any) {
      setErr(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // initial
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [q]); // debounced search

  async function enroll(courseId: string, title: string) {
    try {
      setMsg(null);
      const learnerId = getOrCreateLearnerId();
      const res = await fetch(`${apiBase}/enroll`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ learnerId, courseId }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setMsg(`✅ Enrolled: ${title}`);
      setTimeout(() => setMsg(null), 3000);
    } catch (e:any) {
      setMsg(`❌ Enroll failed: ${e?.message || "error"}`);
      setTimeout(() => setMsg(null), 5000);
    }
  }

  return (
    <div style={{ maxWidth:1150, margin:"0 auto", padding:"28px 16px 60px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div>
          <h1 style={{ margin:0, fontSize:34, fontWeight:900, letterSpacing:-0.5 }}>Courses</h1>
          <div style={{ marginTop:8, opacity:0.75 }}>Colour-coded by subject. Enrol is live. Pay button is staged.</div>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <a href="/subjects" style={{ textDecoration:"none" }}>
            <button style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,0.14)", background:"white", cursor:"pointer", fontWeight:900 }}>Master Subjects Portal</button>
          </a>
          <a href="/enrollments" style={{ textDecoration:"none" }}>
            <button style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,0.14)", background:"rgba(0,0,0,0.04)", cursor:"pointer", fontWeight:900 }}>My Enrollments</button>
          </a>
        </div>
      </div>

      <div style={{ marginTop:14 }}>
        <Card>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…" style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1px solid rgba(0,0,0,0.14)", outline:"none", fontSize:14 }} />
          <div style={{ marginTop:10, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            {loading ? <span>Loading…</span> : <span>Showing <b>{courses.length}</b></span>}
            {err ? <span style={{ color:"crimson" }}>Error: {err}</span> : null}
            {msg ? <span style={{ fontWeight:900 }}>{msg}</span> : null}
          </div>
        </Card>
      </div>

      <div style={{ marginTop:18, display:"grid", gap:14, gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))" }}>
        {courses.map((c) => {
          const subject = (c.subject || "General").trim();
          const color = hashColor(subject);
          return (
            <Card key={c.id}>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <Badge color={color}>{subject}</Badge>
                  <Badge>{(c.level || "—").toLowerCase()}</Badge>
                  <Badge>{c.is_free ? "Free" : "Paid"}</Badge>
                </div>
                <div style={{ fontSize:16, fontWeight:900, lineHeight:1.2 }}>{c.title}</div>
                <div style={{ opacity:0.82, fontSize:14, lineHeight:1.45 }}>{c.description || "No description yet."}</div>

                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button onClick={() => enroll(c.id, c.title)} style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,0.14)", background:"white", cursor:"pointer", fontWeight:900 }}>
                    Enrol
                  </button>

                  {!c.is_free ? (
                    <a href={`/payments?courseId=${encodeURIComponent(c.id)}`} style={{ textDecoration:"none" }}>
                      <button style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,0.14)", background:"rgba(0,0,0,0.04)", cursor:"pointer", fontWeight:900 }}>
                        Pay
                      </button>
                    </a>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
