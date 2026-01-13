"use client";
export default function PaymentCancel() {
  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 16px 60px" }}>
      <h1 style={{ margin:0, fontSize:34, fontWeight:900, letterSpacing:-.5 }}>Payment Cancelled</h1>
      <div style={{ marginTop:12, opacity:.8 }}>No money was taken.</div>
      <div style={{ marginTop:16 }}>
        <a href="/courses" style={{ textDecoration:"none" }}>
          <button style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,0,0,.14)", background:"white", cursor:"pointer", fontWeight:900 }}>Back to Courses</button>
        </a>
      </div>
    </div>
  );
}
