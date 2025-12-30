"use client";

import { useEffect, useMemo, useState } from "react";

type SubjectRow = { subject: string; slug: string; count: number };

function hashColor(input: string) {
  const colors = ["#0ea5e9","#22c55e","#a855f7","#f97316","#e11d48","#14b8a6","#6366f1","#f59e0b"];
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

function Card({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div style={{ border:"1px solid rgba(0,0,0,0.10)", borderRadius:18, padding:16, background:"white", boxShadow:"0 1px 10px rgba(0,0,0,0.05)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:`${accent}10` }} />
      <div style={{ position:"relative" }}>{children}</div>
    </div>
  );
}

export default function SubjectsPortal() {
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "https://readytolearn-api.onrender.com", []);
  const [items, setItems] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setErr(null);
        const res = await fetch(`${apiBase}/subjects`, { cache:"no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        if (!cancelled) setItems(Array.isArray(data.subjects) ? data.subjects : []);
      } catch (e:any) {
        if (!cancelled) setErr(e?.message || "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiBase]);

  return (
    <div style={{ maxWidth:1150, margin:"0 auto", padding:"28px 16px 60px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div>
          <h1 style={{ margin:0, fontSize:34, fontWeight:900, letterSpacing:-0.5 }}>Master Subjects Portal</h1>
          <div style={{ marginTop:8, opacity:0.75 }}>One subject = one card (no repeats).</div>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <a href="/courses" style={{ textDecoration:"none" }}>
            <button style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,0.14)", background:"white", cursor:"pointer", fontWeight:900 }}>All Courses</button>
          </a>
          <a href="/enrollments" style={{ textDecoration:"none" }}>
            <button style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,0.14)", background:"rgba(0,0,0,0.04)", cursor:"pointer", fontWeight:900 }}>My Enrollments</button>
          </a>
        </div>
      </div>

      {loading ? <div style={{ marginTop:16 }}>Loading…</div> : null}
      {err ? <div style={{ marginTop:16, color:"crimson" }}>Error: {err}</div> : null}

      <div style={{ marginTop:18, display:"grid", gap:14, gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))" }}>
        {items.map((s) => {
          const accent = hashColor(s.subject);
          return (
            <a key={s.slug} href={`/subjects/${encodeURIComponent(s.slug)}`} style={{ textDecoration:"none", color:"inherit" }}>
              <Card accent={accent}>
                <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:10 }}>
                  <div style={{ fontSize:18, fontWeight:900 }}>{s.subject}</div>
                  <div style={{ fontWeight:900, opacity:0.9 }}>{s.count}</div>
                </div>
                <div style={{ marginTop:8, opacity:0.75 }}>Open subject</div>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
