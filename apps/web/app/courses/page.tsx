import Link from "next/link";
import { queryCourses } from "./courses.store";

// ✅ Don’t force static for a searchParams-driven page
export const dynamic = "force-dynamic";

export default function CoursesPage({
  searchParams,
}: {
  searchParams?: { page?: string; q?: string; track?: string; level?: string };
}) {
  const qRaw = searchParams?.q ?? "";
  const trackRaw = searchParams?.track ?? "";
  const levelRaw = searchParams?.level ?? "";
  const pageRaw = searchParams?.page ?? "1";
  const page = Math.max(1, Number(pageRaw) || 1);

  const { items: slice, total, totalPages, safePage, pageSize } = queryCourses({
    q: qRaw,
    track: trackRaw,
    level: levelRaw,
    page,
    pageSize: 24,
  });

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (qRaw) params.set("q", qRaw);
    if (trackRaw) params.set("track", trackRaw);
    if (levelRaw) params.set("level", levelRaw);
    if (nextPage > 1) params.set("page", String(nextPage));
    const s = params.toString();
    return s ? `/courses?${s}` : "/courses";
  };

  const prevHref = safePage > 1 ? buildHref(safePage - 1) : null;
  const nextHref = safePage < totalPages ? buildHref(safePage + 1) : null;

  return (
    <main className="card">
      <div className="h1">Courses</div>
      <div className="muted">
        {total.toLocaleString()} course(s) found • Page {safePage} / {totalPages}
      </div>
      <hr />

      <form
        method="get"
        action="/courses"
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "1fr 220px 220px 140px",
          alignItems: "center",
        }}
      >
        <input name="q" defaultValue={qRaw} placeholder="Search title / summary / skills…" />
        <input name="track" defaultValue={trackRaw} placeholder="track (optional)" />
        <input name="level" defaultValue={levelRaw} placeholder="Beginner / Intermediate / Advanced" />
        <button className="btn primary" type="submit">Filter</button>
      </form>

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {slice.map((c: any) => (
          <div key={String(c.id ?? c.slug)} className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800 }}>{String(c.title ?? "Untitled course")}</div>
                {c.summary ? <div className="muted">{String(c.summary)}</div> : null}
                <div className="muted" style={{ marginTop: 6 }}>
                  Track: {String(c.track ?? "n/a")} • Level: {String(c.level ?? "n/a")} •{" "}
                  {String(c.minutes ?? c.durationMinutes ?? "n/a")} min
                </div>
              </div>
              <div className="muted" style={{ whiteSpace: "nowrap" }}>{String(c.id ?? "")}</div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn" href="/courses">Reset</Link>
              {c.track ? (
                <Link className="btn" href={`/courses?track=${encodeURIComponent(String(c.track))}`}>
                  More in {String(c.track)}
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        {prevHref ? <Link className="btn" href={prevHref}>Prev</Link> : <span className="btn" style={{opacity:0.5}}>Prev</span>}
        <div className="muted">
          {total === 0 ? "Showing 0 of 0" : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, total)} of ${total.toLocaleString()}`}
        </div>
        {nextHref ? <Link className="btn" href={nextHref}>Next</Link> : <span className="btn" style={{opacity:0.5}}>Next</span>}
      </div>
    </main>
  );
}
