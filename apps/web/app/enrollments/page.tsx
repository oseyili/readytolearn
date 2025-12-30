"use client";

import { useEffect, useMemo, useState } from "react";

type Enrollment = {
  course_id: string;
  created_at: string;
  title: string;
  level: string;
  language: string;
  is_free: boolean;
};

function getOrCreateLearnerId(): string {
  const key = "rtl_learner_id";
  const existing = localStorage.getItem(key);
  if (existing && typeof existing === "string") return existing;

  const generated =
    (globalThis.crypto as any)?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const v = String(generated); // ✅ always string
  localStorage.setItem(key, v);
  return v;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "rgba(0,0,0,0.03)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.10)",
        borderRadius: 16,
        padding: 16,
        background: "white",
        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
      }}
    >
      {children}
    </div>
  );
}

export default function EnrollmentsPage() {
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "https://readytolearn-api.onrender.com",
    []
  );

  const [learnerId, setLearnerId] = useState<string>("");
  const [items, setItems] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLearnerId(getOrCreateLearnerId());
  }, []);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const id = learnerId || getOrCreateLearnerId();
      const res = await fetch(`${apiBase}/enrollments?learnerId=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setItems(Array.isArray(data.enrollments) ? data.enrollments : []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!learnerId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerId]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 60px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, letterSpacing: -0.4 }}>My Enrollments</h1>
          <div style={{ marginTop: 8, opacity: 0.75 }}>
            Showing <b>{items.length}</b> enrolled courses
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Badge>API: {apiBase}</Badge>
          <Badge>Learner: {learnerId || "…"}</Badge>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={load}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.14)",
                background: "white",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>

            <a
              href="/courses"
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.14)",
                background: "rgba(0,0,0,0.03)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Back to Courses
            </a>

            <span style={{ marginLeft: "auto", opacity: 0.75, fontSize: 13 }}>
              Tip: enroll from Courses, then come back here.
            </span>
          </div>

          {loading ? <div style={{ marginTop: 12 }}>Loading…</div> : null}
          {err ? <div style={{ marginTop: 12, color: "crimson" }}>Error: {err}</div> : null}
        </Card>
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {items.map((e) => (
          <Card key={`${e.course_id}-${e.created_at}`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Badge>{(e.level || "—").toLowerCase()}</Badge>
                <Badge>{(e.language || "en").toLowerCase()}</Badge>
                <Badge>{e.is_free ? "Free" : "Paid"}</Badge>
              </div>

              <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>
                {e.title}
              </div>

              <div style={{ opacity: 0.75, fontSize: 13 }}>
                Enrolled: {new Date(e.created_at).toLocaleString()}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
