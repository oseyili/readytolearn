"use client";

import { useEffect, useMemo, useState } from "react";

export default function PaymentSuccess() {
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "https://readytolearn-api.onrender.com", []);
  const [msg,setMsg] = useState("Finalizing…");

  useEffect(() => {
    (async () => {
      const sp = new URLSearchParams(window.location.search);
      const courseId = sp.get("courseId") || "";
      const learnerId = sp.get("learnerId") || "";
      if (!courseId || !learnerId) { setMsg("Missing courseId/learnerId"); return; }

      try {
        const r = await fetch(`${apiBase}/enroll`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ learnerId, courseId }) });
        const j = await r.json().catch(()=> ({}));
        if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setMsg("✅ Payment received. You are enrolled!");
      } catch(e:any) {
        setMsg(`✅ Payment received, but enroll failed: ${e?.message || "error"}`);
      }
    })();
  }, [apiBase]);

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 16px 60px" }}>
      <h1 style={{ margin:0, fontSize:34, fontWeight:900, letterSpacing:-.5 }}>Payment Success</h1>
      <div style={{ marginTop:12, fontWeight:900 }}>{msg}</div>
      <div style={{ marginTop:16, display:"flex", gap:10, flexWrap:"wrap" }}>
        <a href="/courses" style={{ textDecoration:"none" }}>
          <button style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,.14)", background:"white", cursor:"pointer", fontWeight:900 }}>Back to Courses</button>
        </a>
        <a href="/subjects" style={{ textDecoration:"none" }}>
          <button style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,.14)", background:"rgba(0,0,0,.04)", cursor:"pointer", fontWeight:900 }}>Master Portal</button>
        </a>
      </div>
    </div>
  );
}
