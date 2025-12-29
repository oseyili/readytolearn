"use client";

import { useState } from "react";
import { apiPost, setToken } from "../../../lib/api";

export default function Auth({ searchParams }: { searchParams: { ref?: string } }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState<string>(searchParams?.ref || "");
  const [msg, setMsg] = useState<string>("");

  async function submit() {
    setMsg("");
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body: any = { email, password };
      if (mode === "register" && referralCode) body.referralCode = referralCode;

      const data = await apiPost(path, body);
      setToken(data.token);

      if (mode === "register") {
        const tokenPreview = data.emailVerificationToken ? String(data.emailVerificationToken).slice(0, 12) + "â€¦" : "n/a";
        setMsg(`âœ… Registered.\n(Dev) Verification token: ${tokenPreview}\nOpen: /portal/verify?token=YOURTOKEN`);
      } else {
        setMsg("âœ… Logged in.");
      }
    } catch (e: any) {
      setMsg("âŒ " + (e?.message || "error"));
    }
  }

  return (
    <div className="card">
      <div className="h1">{mode === "login" ? "Login" : "Register"}</div>
      <div className="muted">Password reset + email verification included.</div>
      <hr />
      <div className="row">
        <button className="btn" onClick={() => setMode("login")}>Login</button>
        <button className="btn" onClick={() => setMode("register")}>Register</button>
        <a className="btn" href="/portal/reset/request">Forgot password</a>
      </div>

      <label>Email</label>
      <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" />

      <label>Password</label>
      <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="min 8 characters" type="password" />

      {mode === "register" && (
        <>
          <label>Referral Code (optional)</label>
          <input value={referralCode} onChange={(e)=>setReferralCode(e.target.value)} placeholder="Your friend's code" />
        </>
      )}

      <div className="row" style={{ marginTop:12  }}>
        <button className="btn primary" onClick={submit}>Continue</button>
        <a className="btn" href="/portal/verify">Verify email</a>
      </div>

      {msg && <div className="muted" style={{ marginTop:12, whiteSpace:"pre-wrap"  }}>{msg}</div>}
    </div>
  );
}

