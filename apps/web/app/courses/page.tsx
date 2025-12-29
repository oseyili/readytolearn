import Link from "next/link";

export const dynamic = "force-dynamic";

async function getCourses(params: { q?: string; track?: string; level?: string; page?: string }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.track) sp.set("track", params.track);
  if (params.level) sp.set("level", params.level);
  if (params.page) sp.set("page", params.page);
  sp.set("pageSize", "24");

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/courses?${sp.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Failed to load courses: ${res.status}`);
  return res.json() as Promise<{ items: any[]; total: number; totalPages: number; safePage: number; pageSize: number }>;
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: { page?: string; q?: string; track?: string; level?: string };
}) {
  const qRaw = searchParams?.q ?? "";
  const trackRaw = searchParams?.track ?? "";
  const levelRaw = searchParams?.level ?? "";
  const pageRaw = searchParams?.page ?? "1";

  const data = await getCourses({ q: qRaw, track: trackRaw, level: levelRaw, page: pageRaw });

  const { items: slice, total, totalPages, safePage, pageSize } = data;

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

      <form method="get" action="/courses" style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 220px 220px 140px", alignItems: "center" }}>
        <input name="q" defaultValue={qRaw} placeholder="Search title / summary / skills…" />
        <input name="track" defaultValue={trackRaw} placeholder="track (optional)" />
        <input name="level" defaultValue={levelRaw} placeholder="Beginner / Intermediate / Advanced" />
        <button className="btn primary" type="submit">Filter</button>
      </form>

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {slice.map((c) => (
          <div key={String(c.id ?? c.slug)} className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800 }}>{String(c.title ?? "Untitled course")}</div>
                {c.summary ? <div className="muted">{String(c.summary)}</div> : null}
                <div className="muted" style={{ marginTop: 6 }}>
                  Track: {String(c.track ?? "n/a")} • Level: {String(c.level ?? "n/a")} •{" "}
                  {String(c.minutes ?? c.duration_minutes ?? "n/a")} min
                </div>
              </div>
              <div className="muted" style={{ whiteSpace: "nowrap" }}>{String(c.id ?? "")}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        {prevHref ? <Link className="btn" href={prevHref}>Prev</Link> : <span className="btn" style={{ opacity: 0.5, pointerEvents: "none" }}>Prev</span>}
        <div className="muted">
          {total === 0 ? "Showing 0 of 0" : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, total)} of ${total.toLocaleString()}`}
        </div>
        {nextHref ? <Link className="btn" href={nextHref}>Next</Link> : <span className="btn" style={{ opacity: 0.5, pointerEvents: "none" }}>Next</span>}
      </div>
    </main>
  );
}
