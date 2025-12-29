"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "../../lib/api";

export default function LegacyIntent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [pledgeType, setPledgeType] = useState<"general"|"fixed_sum"|"percentage"|"residue"|"assets">("general");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");
    try {
      const r = await apiPost("/legacy/intent", { name, email, country, pledgeType, note, consent });
      setMsg("âœ… Thank you. Your non-binding intent has been recorded. We may contact you if you provided an email.");
      setName(""); setEmail(""); setCountry(""); setNote(""); setConsent(false); setPledgeType("general");
    } catch (e:any) {
      setMsg("âŒ " + (e?.message || "error"));
    }
  }

  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Legacy Giving â€” Intent Form</div>
        <div className="muted">Optional, non-binding. This is not legal advice.</div>
        <hr />
        <div className="muted" style={{ whiteSpace:"pre-wrap", lineHeight:1.7  }}>
          This form simply records that you may be considering a legacy gift to support learning access on Readytolearn.
          It does not create any legal obligation. Please consult a qualified solicitor/attorney for wills and estate planning.
        </div>

        {msg && <div className="muted" style={{ marginTop:12, whiteSpace:"pre-wrap"  }}>{msg}</div>}

        <div className="grid" style={{ marginTop:12  }}>
          <div className="card col-6" style={{ background:"var(--surface2)"  }}>
            <label>Your name (optional)</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} />
            <label>Email (optional)</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" />
            <label>Country (optional)</label>
            <input value={country} onChange={(e)=>setCountry(e.target.value)} placeholder="e.g. United Kingdom" />
          </div>

          <div className="card col-6" style={{ background:"var(--surface2)"  }}>
            <label>What type of legacy gift are you considering?</label>
            <select value={pledgeType} onChange={(e)=>setPledgeType(e.target.value as any)}>
              <option value="general">General (not sure yet)</option>
              <option value="fixed_sum">Fixed sum</option>
              <option value="percentage">Percentage of estate</option>
              <option value="residue">Residual estate</option>
              <option value="assets">Assets / proceeds (executor liquidation)</option>
            </select>
            <label>Note (optional)</label>
            <textarea value={note} onChange={(e)=>setNote(e.target.value)} rows={5} />
            <div className="row" style={{ marginTop:10  }}>
              <label style={{ display:"flex", gap:10, alignItems:"center"  }}>
                <input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} />
                I consent to Readytolearn storing this information and contacting me (if I provided email).
              </label>
            </div>
            <div className="row" style={{ marginTop:12  }}>
              <button className="btn primary" onClick={submit} disabled={!consent}>Submit intent</button>
              <Link className="btn" href="/legacy-giving">Back to Legacy Giving</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

