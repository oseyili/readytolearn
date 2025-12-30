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

export default function CoursesPage() {
  const apiBase = useMemo(() => {
    // Static export: this is baked at build time.
    // So you MUST set NEXT_PUBLIC_API_URL in Render for readytolearn-web.
    return process.env.NEXT_PUBLIC_API_URL || "https://readytolearn-api.onrender.com";
  }, []);

  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(`${apiBase}/courses`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!data?.ok || !Array.isArray(data.courses)) throw new Error("Bad payload");

        if (!cancelled) setCourses(data.courses);
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

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Courses</h1>

      <div style={{ marginTop: 8, opacity: 0.85 }}>
        API: <code>{apiBase}</code>
      </div>

      {loading ? <p style={{ marginTop: 16 }}>Loading courses…</p> : null}
      {err ? (
        <p style={{ marginTop: 16, color: "crimson" }}>
          Error: {err}
          <br />
          Check NEXT_PUBLIC_API_URL in Render (readytolearn-web).
        </p>
      ) : null}

      <p style={{ marginTop: 16, opacity: 0.8 }}>
        Showing {courses.length} courses
      </p>

      <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
        {courses.map((c) => (
          <div key={c.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 700 }}>{c.title}</div>
            <div style={{ opacity: 0.8, marginTop: 4 }}>
              {(c.level ?? "—")} • {(c.language ?? "en")} •{" "}
              {c.is_free === true ? "Free" : c.is_free === false ? "Paid" : ""}
            </div>
            {c.description ? <div style={{ marginTop: 8 }}>{c.description}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
