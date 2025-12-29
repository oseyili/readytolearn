"use client";

import { useMemo, useState } from "react";
import { apiPost } from "../../../lib/api";

export default function Verify({ searchParams }: { searchParams: { token?: string } }) {
  const token = useMemo(()=>searchParams?.token || "", [searchParams]);
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");
    try {
      await apiPost("/auth/verify-email", { token });
      setMsg("âœ… Email verified. Thank you.");
    } catch (e:any) {
      setMsg("âŒ " + (e?.message || "error"));
    }
  }

  return (
    <div className="card">
      <div className="h1">Verify Email</div>
      <div className="muted">Open this page from your verification link.</div>
      <hr />
      <div className="muted">Token: {token ? token.slice(0, 10) + "â€¦" : "(missing)"}</div>
      <div className="row" style={{ marginTop:12  }}>
        <button className="btn primary" onClick={submit} disabled={!token}>Verify</button>
      </div>
      {msg && <div className="muted" style={{ marginTop:12, whiteSpace:"pre-wrap"  }}>{msg}</div>}
    </div>
  );
}

