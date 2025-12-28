"use client";

import { useState } from "react";
import { apiPost } from "../../../../lib/api";

export default function ResetRequest() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");
    try {
      const data = await apiPost("/auth/request-password-reset", { email });
      setMsg("✅ If the email exists, a reset link was generated. (Dev token): " + (data.resetToken || "(hidden)"));
    } catch (e:any) {
      setMsg("❌ " + (e?.message || "error"));
    }
  }

  return (
    <div className="card">
      <div className="h1">Password Reset</div>
      <div className="muted">Enter your email to request a reset link.</div>
      <hr />
      <label>Email</label>
      <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" />
      <div className="row" style={{marginTop:12}}>
        <button className="btn primary" onClick={submit}>Request Reset</button>
      </div>
      {msg && <div className="muted" style={{marginTop:12, whiteSpace:"pre-wrap"}}>{msg}</div>}
    </div>
  );
}
