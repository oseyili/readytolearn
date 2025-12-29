"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, getToken, API } from "../../../lib/api";

export default function Certificates() {
  const [certs, setCerts] = useState<any[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [courseId, setCourseId] = useState<string>("");
  const [msg, setMsg] = useState("");

  async function refresh() {
    setMsg("");
    try {
      const token = getToken();
      if (!token) { setMsg("âŒ Please login first."); return; }
      const d = await apiGet("/certificates/mine", token);
      setCerts(d.certificates || []);
      const c = await apiGet("/user/certificate-credits", token);
      setCredits(c.credits ?? 0);
    } catch (e:any) {
      setMsg("âŒ " + (e?.message || "error"));
    }
  }

  async function redeem() {
    setMsg("");
    try {
      const token = getToken();
      if (!token) { setMsg("âŒ Please login first."); return; }
      if (!courseId) { setMsg("âŒ Paste a Course ID to redeem a sponsored certificate credit."); return; }
      await apiPost("/certificates/issue-from-credit", { courseId }, token);
      setMsg("âœ… Certificate issued using a sponsored credit.");
      setCourseId("");
      await refresh();
    } catch (e:any) {
      setMsg("âŒ " + (e?.message || "error"));
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div className="card">
      <div className="h1">Certificates</div>
      <div className="muted">Issued certificates + verification + PDF. Sponsored learners can redeem certificate credits.</div>
      <hr />
      {msg && <div className="muted" style={{ whiteSpace:"pre-wrap"  }}>{msg}</div>}

      <div className="card" style={{ background:"var(--surface2)", marginBottom: 12  }}>
        <div className="h2">Sponsored certificate credits</div>
        <div className="muted">Credits are granted when a sponsor funds a certificate through Compassionate Give.</div>
        <div className="row" style={{ marginTop:10  }}>
          <span className="badge">Credits: {credits}</span>
        </div>
        <div className="muted" style={{ marginTop:10  }}>
          To redeem, paste a Course ID (UUID) and issue your certificate.
        </div>
        <div className="row" style={{ marginTop:10  }}>
          <input value={courseId} onChange={(e)=>setCourseId(e.target.value)} placeholder="Course ID (uuid)" style={{ minWidth: 320  }} />
          <button className="btn primary" onClick={redeem} disabled={credits<=0}>Redeem credit</button>
          <button className="btn" onClick={refresh}>Refresh</button>
        </div>
      </div>

      <div className="grid">
        {certs.map((c) => (
          <div key={c.public_id} className="card col-6" style={{ background:"var(--surface2)"  }}>
            <div className="h2">{c.title}</div>
            <div className="row">
              <span className="badge">{c.level}</span>
              <span className="badge">{c.language}</span>
            </div>
            <div className="muted" style={{ marginTop:10, wordBreak:"break-all"  }}>
              Verify: <a href={`/portal/certificates/verify/${c.public_id}`}>{`/portal/certificates/verify/${c.public_id}`}</a>
            </div>
            <div className="row" style={{ marginTop:12  }}>
              <a className="btn primary" href={`${API}/certificates/pdf/${c.public_id}`} target="_blank">Open PDF</a>
            </div>
          </div>
        ))}
      </div>
      {certs.length === 0 && <div className="muted">No certificates yet.</div>}
    </div>
  );
}

