"use client";

import { useEffect, useState } from "react";
import { apiGet, getToken } from "../../../lib/api";

export default function Referrals() {
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        if (!token) { setMsg("❌ Please login first."); return; }
        const d = await apiGet("/referrals/me", token);
        setData(d);
      } catch (e:any) {
        setMsg("❌ " + (e?.message || "error"));
      }
    })();
  }, []);

  const shareUrl = data?.code ? (typeof window !== "undefined" ? `${window.location.origin}/portal/auth?ref=${data.code}` : "") : "";

  return (
    <div className="card">
      <div className="h1">Referrals</div>
      <div className="muted">Share your code. Track signups.</div>
      <hr />
      {msg && <div className="muted" style={{whiteSpace:"pre-wrap"}}>{msg}</div>}
      {data && (
        <>
          <div className="row">
            <span className="badge">Code: {data.code}</span>
            <span className="badge">Referrals: {data.referrals}</span>
          </div>
          <div style={{marginTop:12}} className="muted">Share link:</div>
          <div className="muted" style={{marginTop:6, wordBreak:"break-all"}}>{shareUrl}</div>
        </>
      )}
    </div>
  );
}
