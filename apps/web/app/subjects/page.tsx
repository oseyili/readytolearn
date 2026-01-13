"use client";

import { useEffect, useMemo, useState } from "react";

type SubjectRow = { subject: string; slug: string; count: number };

function colorFor(s: string) {
  const colors = ["#0ea5e9","#22c55e","#a855f7","#f97316","#e11d48","#14b8a6","#6366f1","#f59e0b"];
  let h = 0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i))>>>0;
  return colors[h % colors.length];
}

function Card({ accent, children }:{ accent:string; children:React.ReactNode }) {
  return (
    <div style={{ border:"1px solid rgba(0,0,0,.10)", borderRadius:18, padding:16, background:"white", boxShadow:"0 1px 10px rgba(0,0,0,.06)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:`${accent}12` }} />
      <div style={{ position:"relative" }}>{children}</div>
    </div>
  );
}

export default function SubjectsPortal() {
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "https://readytolearn-api.onrender.com",
    []
  );
  const [items,setItems] = useState<SubjectRow[]>([]);
  const [loading,setLoading] = useState(true);
  const [err,setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setErr(null);
        const r = await fetch(`${apiBase}/subjects`, { cache:"no-store" });
        const j = await r.json().catch(()=> ({}));
        if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setItems(Array.isArray(j.subjects)? j.subjects : []);
      } catch(e:any) {
        setErr(e?.message || "Failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [apiBase]);

  return (
    <div style={{ maxWidth:1150, margin:"0 auto", padding:"28px 16px 60px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div>
          <h1 style={{ margin:0, fontSize:34, fontWeight:900, letterSpacing:-.5 }}>Master Subjects Portal</h1>
          <div style={{ marginTop:8, opacity:.75 }}>Unique subjects. Color-coded.</div>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <a href="/courses" style={{ textDecoration:"none" }}>
            <button style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,.14)", background:"white", cursor:"pointer", fontWeight:900 }}>All Courses</button>
          </a>
        </div>
      </div>

      {loading ? <div style={{ marginTop:16 }}>Loading…</div> : null}
      {err ? <div style={{ marginTop:16, color:"crimson" }}>Error: {err}</div> : null}

      <div style={{ marginTop:18, display:"grid", gap:14, gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))" }}>
        {items.map(s => {
          const c = colorFor(s.slug);
          return (
            <a key={s.slug} href={`/subjects/${encodeURIComponent(s.slug)}`} style={{ textDecoration:"none", color:"inherit" }}>
              <Card accent={c}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:10 }}>
                  <div style={{ fontSize:18, fontWeight:900 }}>{s.subject}</div>
                  <div style={{ fontWeight:900 }}>{s.count}</div>
                </div>
                <div style={{ marginTop:8, opacity:.75 }}>Open</div>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
