import { Suspense } from "react";
import type { Role } from "@readytolearn/ui";

// Fallback static data (your existing thousands)
import { courses as fallbackCourses } from "./courses.data";

type ApiCourse = {
  id: string;
  title: string;
  level: string;
  language: string;
  description: string;
  is_free: boolean;
  created_at: string;
};

async function loadCourses(): Promise<ApiCourse[]> {
  const base = process.env.NEXT_PUBLIC_API_URL || "https://readytolearn-api.onrender.com";

  try {
    const res = await fetch(`${base}/courses`, { cache: "no-store" });
    if (!res.ok) throw new Error("bad_response");
    const data = await res.json();
    if (data?.ok && Array.isArray(data.courses)) return data.courses;
    throw new Error("bad_payload");
  } catch {
    // If API is down, show your static thousands instead
    return (fallbackCourses as any) ?? [];
  }
}

async function CoursesList() {
  const courses = await loadCourses();

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Courses</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Showing {courses.length} courses
      </p>

      <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
        {courses.map((c: any) => (
          <div
            key={c.id ?? c.slug ?? c.title}
            style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14 }}
          >
            <div style={{ fontWeight: 700 }}>{c.title}</div>
            <div style={{ opacity: 0.8, marginTop: 4 }}>
              {c.level ?? c.difficulty ?? "—"} • {c.language ?? "en"} •{" "}
              {c.is_free === true ? "Free" : c.is_free === false ? "Paid" : ""}
            </div>
            {c.description ? (
              <div style={{ marginTop: 8 }}>{c.description}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading courses…</div>}>
      {/* @ts-expect-error Async Server Component */}
      <CoursesList />
    </Suspense>
  );
}
