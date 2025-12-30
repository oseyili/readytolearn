"use client";

import { useEffect, useMemo, useState } from "react";

type ApiCourse = {
  id: string;
  title: string;
  level?: string;
  language?: string;
  description?: string;
  is_free?: boolean;
  created_at?: string;
};

const LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;
type LevelFilter = (typeof LEVELS)[number];

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
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

export default function CoursesPage() {
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "https://readytolearn-api.onrender.com",
    []
  );

  const [allCourses, setAllCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [freeOnly, setFreeOnly] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 24;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErr(null);

        // Pull enough for now. If you later store 10k+ courses, we’ll add server pagination.
        const res = await fetch(`${apiBase}/courses?limit=5000&offset=0`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!data?.ok || !Array.isArray(data.courses)) throw new Error("Bad payload");

        if (!cancelled) setAllCourses(data.courses);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return allCourses.filter((c) => {
      if (freeOnly && c.is_free !== true) return false;

      if (level !== "all" && (c.level || "").toLowerCase() !== level) return false;

      if (!query) return true;

      const hay = `${c.title ?? ""} ${c.description ?? ""} ${c.level ?? ""} ${c.language ?? ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [allCourses, q, level, freeOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  useEffect(() => {
    // reset to page 1 when filters change
    setPage(1);
  }, [q, level, freeOnly]);

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "28px 16px 60px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, letterSpacing: -0.4 }}>Courses</h1>
          <div style={{ marginTop: 8, opacity: 0.75 }}>
            Browse and filter courses. Showing <b>{filtered.length}</b> results
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Badge>API: {apiBase}</Badge>
        </div>
      </div>

      <Card>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr", marginTop: 4 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr", alignItems: "center" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, description, level…"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.14)",
                outline: "none",
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, opacity: 0.75 }}>Level</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as LevelFilter)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.14)",
                  background: "white",
                  fontSize: 14,
                }}
              >
                {LEVELS.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv}
                  </option>
                ))}
              </select>
            </div>

            <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
              />
              <span style={{ fontSize: 14 }}>Free only</span>
            </label>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <Badge>
                Page {safePage} / {totalPages}
              </Badge>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.14)",
                  background: safePage <= 1 ? "rgba(0,0,0,0.05)" : "white",
                  cursor: safePage <= 1 ? "not-allowed" : "pointer",
                }}
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.14)",
                  background: safePage >= totalPages ? "rgba(0,0,0,0.05)" : "white",
                  cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          </div>

          {loading ? <div style={{ padding: 8 }}>Loading…</div> : null}
          {err ? <div style={{ padding: 8, color: "crimson" }}>Error: {err}</div> : null}
        </div>
      </Card>

      <div style={{ marginTop: 18, display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {pageItems.map((c) => (
          <Card key={c.id}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Badge>{(c.level || "—").toLowerCase()}</Badge>
                <Badge>{(c.language || "en").toLowerCase()}</Badge>
                <Badge>{c.is_free ? "Free" : "Paid"}</Badge>
                {c.created_at ? <Badge>{formatDate(c.created_at)}</Badge> : null}
              </div>

              <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>
                {c.title}
              </div>

              <div style={{ opacity: 0.82, fontSize: 14, lineHeight: 1.4 }}>
                {c.description || "No description provided yet."}
              </div>

              <div style={{ marginTop: 4, display: "flex", gap: 10 }}>
                <button
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.14)",
                    background: "white",
                    cursor: "pointer",
                  }}
                  onClick={() => alert(`Coming soon: open course ${c.title}`)}
                >
                  View
                </button>
                <button
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.14)",
                    background: "rgba(0,0,0,0.03)",
                    cursor: "pointer",
                  }}
                  onClick={() => alert("Coming soon: enroll")}
                >
                  Enroll
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
