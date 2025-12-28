"use client";

import { useMemo, useState } from "react";
import { apiPost } from "../../../../lib/api";

export default function ResetConfirm({ searchParams }: { searchParams: { token?: string } }) {
  const token = useMemo(()=>searchParams?.token || "", [searchParams]);
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");
    try {
      await apiPost("/auth/reset-password", { token, newPassword });
      setMsg("✅ Password updated. You can now login.");
    } catch (e:any) {
      setMsg("❌ " + (e?.message || "error"));
    }
  }

  return (
    <div className="card">
      <div className="h1">Set New Password</div>
      <div className="muted">Open this page from your reset link (token in URL).</div>
      <hr />
      <div className="muted">Token: {token ? token.slice(0, 10) + "…" : "(missing)"}</div>
      <label>New Password</label>
      <input value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} type="password" placeholder="min 8 characters" />
      <div className="row" style={{marginTop:12}}>
        <button className="btn primary" onClick={submit} disabled={!token}>Update Password</button>
      </div>
      {msg && <div className="muted" style={{marginTop:12, whiteSpace:"pre-wrap"}}>{msg}</div>}
    </div>
  );
}
