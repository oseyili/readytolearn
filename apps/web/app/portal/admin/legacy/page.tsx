"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, getToken, API } from "../../../../lib/api";

function money(cents: number, currency: string) {
  const v = (cents ?? 0) / 100;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(v);
}

export default function AdminLegacy() {
  const [intents, setIntents] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const [intentId, setIntentId] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("");
  const [amount, setAmount] = useState("10000"); // cents
  const [currency, setCurrency] = useState<"gbp"|"usd"|"eur">("gbp");
  const [method, setMethod] = useState<"bank"|"card"|"crypto"|"other">("bank");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setMsg("");
    try {
      const token = getToken();
      if (!token) { setMsg("❌ Please login first."); return; }
      const i = await apiGet("/admin/legacy/intents", token);
      const g = await apiGet("/admin/legacy/gifts", token);
      setIntents(i.intents || []);
      setGifts(g.gifts || []);
    } catch (e:any) {
      setMsg("❌ " + (e?.message || "error"));
    }
  }

  async function setStatus(id: string, status: "new"|"contacted"|"closed") {
    setMsg("");
    try {
      const token = getToken();
      await apiPost("/admin/legacy/intents/status", { id, status }, token);
      setMsg("✅ Updated intent status.");
      await load();
    } catch (e:any) { setMsg("❌ " + (e?.message || "error")); }
  }

  async function recordGift() {
    setMsg("");
    try {
      const token = getToken();
      await apiPost("/admin/legacy/gifts/record", {
        intentId: intentId || undefined,
        receivedFrom: receivedFrom || undefined,
        amountCents: Number(amount || "0"),
        currency,
        method,
        reference: reference || undefined,
        note: note || undefined,
        verified: true,
      }, token);
      setMsg("✅ Legacy gift recorded as verified.");
      setIntentId(""); setReceivedFrom(""); setReference(""); setNote("");
      await load();
    } catch (e:any) { setMsg("❌ " + (e?.message || "error")); }
  }


async function verifyGift(id: string) {
  setMsg("");
  try {
    const token = getToken();
    const r = await apiGet(`/admin/legacy/gifts/verify/${id}`, token);
    if (r.matches) setMsg(`✅ Receipt verified. Receipt # ${r.receipt_number}\nHash: ${r.stored_hash}`);
    else setMsg(`❌ Receipt hash mismatch!\nStored: ${r.stored_hash}\nRecomputed: ${r.recomputed_hash}`);
  } catch (e:any) {
    setMsg("❌ " + (e?.message || "error"));
  }
}

  useEffect(()=>{ load(); }, []);

  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Admin — Legacy Giving</div>
        <div className="muted">Intents and verified legacy gifts (executor/solicitor transfers). No legal advice is provided via the platform.</div>
        <hr />
        {msg && <div className="muted" style={{whiteSpace:"pre-wrap"}}>{msg}</div>}
        <div className="row" style={{marginTop:12}}>
          <button className="btn" onClick={load}>Refresh</button>
          <label style={{marginLeft:12}}>Year</label>
          <input value={year} onChange={(e)=>setYear(e.target.value)} style={{maxWidth:110}} />
          <a className="btn" href={`${API}/admin/legacy/export.csv?year=${year}`} target="_blank">Export CSV</a>
          <a className="btn" href={`${API}/admin/legacy/report/${year}.pdf`} target="_blank">Impact PDF</a>
        </div>
      </div>

      <div className="card col-6">
        <div className="h2">Legacy intents</div>
        <div className="muted">Non-binding declarations from supporters.</div>
        <hr />
        {intents.map((i)=>(
          <div key={i.id} className="card" style={{background:"var(--surface2)", marginBottom:10}}>
            <div className="row" style={{justifyContent:"space-between"}}>
              <div><b>{i.name || "Anonymous"}</b> • {i.pledge_type}</div>
              <span className="badge">{i.status}</span>
            </div>
            <div className="muted">{i.email || ""} {i.country ? "• "+i.country : ""}</div>
            {i.note && <div className="muted" style={{marginTop:6}}>{i.note}</div>}
            <div className="row" style={{marginTop:10}}>
              <button className="btn" onClick={()=>setStatus(i.id,"contacted")}>Mark contacted</button>
              <button className="btn" onClick={()=>setStatus(i.id,"closed")}>Close</button>
              <button className="btn primary" onClick={()=>setIntentId(i.id)}>Use in record form</button>
            </div>
          </div>
        ))}
        {intents.length===0 && <div className="muted">No intents yet.</div>}
      </div>

      <div className="card col-6">
        <div className="h2">Record verified legacy gift</div>
        <div className="muted">Use when funds arrive from an executor/solicitor.</div>
        <hr />
        <label>Intent ID (optional)</label>
        <input value={intentId} onChange={(e)=>setIntentId(e.target.value)} placeholder="uuid (optional)" />
        <label>Received from (executor/solicitor reference)</label>
        <input value={receivedFrom} onChange={(e)=>setReceivedFrom(e.target.value)} placeholder="e.g. Smith & Co Solicitors" />
        <div className="row">
          <div style={{flex:1}}>
            <label>Amount (cents)</label>
            <input value={amount} onChange={(e)=>setAmount(e.target.value)} />
          </div>
          <div style={{flex:1}}>
            <label>Currency</label>
            <select value={currency} onChange={(e)=>setCurrency(e.target.value as any)}>
              <option value="gbp">GBP</option>
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div style={{flex:1}}>
            <label>Method</label>
            <select value={method} onChange={(e)=>setMethod(e.target.value as any)}>
              <option value="bank">Bank</option>
              <option value="card">Card</option>
              <option value="crypto">Crypto</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{flex:1}}>
            <label>Reference</label>
            <input value={reference} onChange={(e)=>setReference(e.target.value)} placeholder="bank ref / tx id" />
          </div>
        </div>
        <label>Note</label>
        <textarea value={note} onChange={(e)=>setNote(e.target.value)} rows={4} />
        <div className="row" style={{marginTop:12}}>
          <button className="btn primary" onClick={recordGift}>Record verified gift</button>
        </div>

        <hr />
        <div className="h2">Verified gifts (recent)</div>
        {gifts.map((g)=>(
          <div key={g.id} className="card" style={{background:"var(--surface2)", marginBottom:10}}>
            <div className="row" style={{justifyContent:"space-between"}}>
              <div><b>{money(g.amount_cents, g.currency)}</b> • {g.method}</div>
              <span className="badge">{g.verified ? "verified" : "unverified"}</span>
            </div>
            <div className="muted">{g.received_from || ""} {g.reference ? "• "+g.reference : ""}</div>
            <div className="muted" style={{marginTop:6}}>Receipt: <b>{g.receipt_number || "—"}</b></div>
            {g.receipt_hash && <div className="muted" style={{wordBreak:"break-all"}}>Hash: {g.receipt_hash}</div>}
            <div className="row" style={{marginTop:8}}>
              <a className="btn" href={`${API}/admin/legacy/gifts/receipt/${g.id}.pdf`} target="_blank">Receipt PDF</a>
              <button className="btn" onClick={()=>verifyGift(g.id)}>Verify hash</button>
            </div>
          </div>
        ))}
        {gifts.length===0 && <div className="muted">No gifts recorded yet.</div>}
      </div>
    </div>
  );
}
