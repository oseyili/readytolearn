"use client";

import { useMemo } from "react";

export default function PaymentsPage() {
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "https://readytolearn-api.onrender.com", []);
  const courseId = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("courseId") || "") : "";

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 16px 60px" }}>
      <h1 style={{ margin:0, fontSize:34, fontWeight:900, letterSpacing:-0.5 }}>Payments</h1>
      <div style={{ marginTop:10, opacity:0.8 }}>CourseId: <code>{courseId || "(none)"}</code></div>

      <div style={{ marginTop:18, border:"1px solid rgba(0,0,0,0.10)", borderRadius:18, padding:16, background:"white", boxShadow:"0 1px 10px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize:16, fontWeight:900 }}>Payment options (stage 1)</div>
        <div style={{ marginTop:10, opacity:0.85, lineHeight:1.5 }}>
          This page is wired (no “broken” look). Next step is Stripe Checkout via the API.
        </div>

        <div style={{ marginTop:12, padding:12, borderRadius:12, background:"rgba(0,0,0,0.04)" }}>
          <div style={{ fontWeight:900 }}>Coming next</div>
          <div style={{ opacity:0.85 }}>Card payments, receipts, and unlock course access.</div>
        </div>

        <div style={{ marginTop:14, display:"flex", gap:10, flexWrap:"wrap" }}>
          <a href="/courses" style={{ textDecoration:"none" }}>
            <button style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,0.14)", background:"white", cursor:"pointer", fontWeight:900 }}>Back to Courses</button>
          </a>
          <a href="/subjects" style={{ textDecoration:"none" }}>
            <button style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,0.14)", background:"rgba(0,0,0,0.04)", cursor:"pointer", fontWeight:900 }}>Subjects Portal</button>
          </a>
        </div>

        <div style={{ marginTop:12, opacity:0.7 }}>API: <code>{apiBase}</code></div>
      </div>
    </div>
  );
}
