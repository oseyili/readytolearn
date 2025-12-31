import { useState } from "react";

/* ---------- helpers ---------- */
function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Unknown error";
}

/* ---------- component ---------- */
export default function Courses() {
  const apiBase = import.meta.env.VITE_API_BASE;

  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function enroll(courseId: string) {
    try {
      setMsg(null);

      const learnerId = getOrCreateLearnerId();

      const r = await fetch(`${apiBase}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId, courseId }),
      });

      const j = await r.json().catch(() => ({} as any));

      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || `HTTP ${r.status}`);
      }

      setMsg("✅ Enrolled successfully");
      setTimeout(() => setMsg(null), 3000);
    } catch (e: unknown) {
      setMsg(`❌ Enroll failed: ${errMsg(e)}`);
      setTimeout(() => setMsg(null), 5000);
    }
  }

  async function pay(courseId: string) {
    try {
      setMsg(null);

      const learnerId = getOrCreateLearnerId();

      const r = await fetch(`${apiBase}/payments/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId, courseId }),
      });

      const j = await r.json().catch(() => ({} as any));

      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || `HTTP ${r.status}`);
      }

      if (typeof j.url !== "string") {
        throw new Error("Missing checkout URL");
      }

      window.location.assign(j.url);
    } catch (e: unknown) {
      setMsg(`❌ Payment failed: ${errMsg(e)}`);
      setTimeout(() => setMsg(null), 6000);
    }
  }

  return (
    <div style={{ maxWidth: 1150, margin: "0 auto", padding: "28px 16px 60px" }}>
      <h1>Courses</h1>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search…"
      />

      <div style={{ marginTop: 10 }}>
        {loading && <span>Loading…</span>}
        {!loading && <span>Showing <b>{items.length}</b></span>}
        {err && <span style={{ color: "crimson" }}>Error: {err}</span>}
        {msg && <span style={{ fontWeight: 900 }}>{msg}</span>}
      </div>
    </div>
  );
}
