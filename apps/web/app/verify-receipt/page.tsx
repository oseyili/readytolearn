"use client";

import { useState } from "react";
import Link from "next/link";
import { apiGet } from "../lib/api";

function money(cents: number, currency: string) {
  const v = (cents ?? 0) / 100;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(v);
}

export default function VerifyReceipt() {
  const [receiptNumber, setReceiptNumber] = useState("");
  const [receiptHash, setReceiptHash] = useState("");
  const [result, setResult] = useState<any>(null);
  const [msg, setMsg] = useState("");

  async function verify() {
    setMsg("");
    setResult(null);
    try {
      const q = `?receiptNumber=${encodeURIComponent(receiptNumber.trim())}&receiptHash=${encodeURIComponent(receiptHash.trim())}`;
      const r = await apiGet(`/legacy/receipts/verify${q}`);
      setResult(r);
      if (r.valid && r.verified) setMsg("✅ Receipt is valid and verified.");
      else if (r.valid && !r.verified) setMsg("✅ Receipt exists, but is not marked verified.");
      else setMsg("❌ Receipt is not valid.");
    } catch (e:any) {
      setMsg("❌ " + (e?.message || "error"));
    }
  }

  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Verify a Readytolearn Legacy Receipt</div>
        <div className="muted">This check confirms whether a receipt number and hash match a recorded legacy gift. No personal information is shown.</div>
        <hr />

        {msg && <div className="muted" style={{whiteSpace:"pre-wrap"}}>{msg}</div>}

        <label>Receipt number</label>
        <input value={receiptNumber} onChange={(e)=>setReceiptNumber(e.target.value)} placeholder="LG-YYYY-000001" />

        <label>Receipt hash</label>
        <input value={receiptHash} onChange={(e)=>setReceiptHash(e.target.value)} placeholder="SHA-256 hash" />

        <div className="row" style={{marginTop:12}}>
          <button className="btn primary" onClick={verify} disabled={!receiptNumber.trim() || !receiptHash.trim()}>
            Verify
          </button>
          <Link className="btn" href="/legacy-giving">Legacy Giving</Link>
          <Link className="btn" href="/">Home</Link>
        </div>
      </div>

      {result?.valid && result?.verified && (
        <div className="card col-12">
          <div className="h2">Verified receipt details</div>
          <div className="muted">Minimal details only (no donor/executor data).</div>
          <hr />
          <div className="row">
            <span className="badge">{result.receiptNumber}</span>
            <span className="badge">{money(result.amountCents, result.currency)}</span>
            <span className="badge">{new Date(result.receivedAt).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
