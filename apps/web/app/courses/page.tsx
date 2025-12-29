import Link from "next/link";
import { COURSES } from "./courses.data";

export default function CoursesPage() {
  return (
    <main className="card">
      <div className="h1">Courses</div>
      <div className="muted">Browse learning paths and modules.</div>
      <hr />

      <div style={{ display: "grid", gap: 12 }}>
        {COURSES.map((c) => (
          <div key={c.slug} className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{c.title}</div>
                <div className="muted">{c.summary}</div>
              </div>

              <div className="muted" style={{ whiteSpace: "nowrap" }}>
                {c.level} • {c.minutes} min
              </div>
            </div>

            {c.tags?.length ? (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="muted"
                    style={{
                      border: "1px solid var(--border)",
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            <div style={{ marginTop: 12 }}>
              <Link className="btn" href={`/courses/${c.slug}`}>
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
