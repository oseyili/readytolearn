"use client";

import { useState } from "react";
import { apiPost } from "../../../lib/api";

const KEY = "rtl_token_v1";

export default function Payments() {
  const [msg, setMsg] = useState("");

  async function buy(item: "certificate" | "subscription") {
    setMsg("");
    const token = localStorage.getItem(KEY) || "";
    if (!token) {
      setMsg("❌ Please login first (token missing).");
      return;
    }
    try {
      const data = await apiPost("/payments/create-session", { item }, token);
      window.location.href = data.url;
    } catch (e: any) {
      setMsg("❌ " + (e?.message || "error"));
    }
  }

  return (
    <div className="card">
      <div className="h1">Payments</div>
      <div className="muted">
        Cards + Apple Pay/Google Pay via Stripe. Crypto is supported after launch via region-allowed gateways.
      </div>
      <hr />
      <div className="row">
        <button className="btn primary" onClick={() => buy("certificate")}>Buy Certificate (£19.99)</button>
        <button className="btn" onClick={() => buy("subscription")}>Pro Monthly (£9.99)</button>
      </div>
      {msg && <div className="muted" style={{marginTop:12}}>{msg}</div>}
    </div>
  );
}
