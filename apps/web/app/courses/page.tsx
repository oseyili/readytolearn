import Link from "next/link";
import { COURSES } from "./courses.data";

export const dynamic = "force-static";

export default function CoursesPage({
  searchParams,
}: {
  searchParams?: { page?: string; q?: string; track?: string; level?: string };
}) {
  const pageSize = 24;

  const qRaw = searchParams?.q ?? "";
  const trackRaw = searchParams?.track ?? "";
  const levelRaw = searchParams?.level ?? "";
  const pageRaw = searchParams?.page ?? "1";

  const q = qRaw.toLowerCase().trim();
  const track = trackRaw.trim();
  const level = levelRaw.trim();
  const page = Math.max(1, Number(pageRaw) || 1);

  let filtered: any[] = COURSES as any[];

  if (track) filtered = filtered.filter((c) => String(c.track) === track);
  if (level) filtered = filtered.filter((c) => String(c.level) === level);

  if (q) {
    filtered = filtered.filter((c) => {
      const title = String(c.title ?? "");
      const summary = String(c.summary ?? "");
      const skills = Array.isArray(c.skills) ? c.skills.join(" ") : "";
      return (title + " " + summary + " " + skills).toLowerCase().includes(q);
    });
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (qRaw) params.set("q", qRaw);
    if (trackRaw) params.set("track", trackRaw);
    if (levelRaw) params.set("level", levelRaw);
    if (nextPage > 1) params.set("page", String(nextPage));
    const s = params.toString();
    return s ? `/courses?${s}` : "/courses";
  };

  return (
    <main className="card">
      <div className="h1">Courses</div>
      <div className="muted">
        {total.toLocaleString()} course(s) found • Page {safePage} / {totalPages}
      </div>
      <hr />

      <form
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "1fr 220px 220px 140px",
          alignItems: "center",
        }}
      >
        <input
          name="q"
          defaultValue={qRaw}
          placeholder="Search title / summary / skills…"
          style={{
            padding: 10,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "inherit",
          }}
        />
        <input
          name="track"
          defaultValue={trackRaw}
          placeholder="track (optional)"
          style={{
            padding: 10,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "inherit",
          }}
        />
        <input
          name="level"
          defaultValue={levelRaw}
          placeholder="Beginner / Intermediate / Advanced"
          style={{
            padding: 10,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "inherit",
          }}
        />
        <button className="btn primary" type="submit">
          Filter
        </button>
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
                  {String(c.minutes ?? c.durationMinutes ?? "n/a")} min
                </div>
              </div>
              <div className="muted" style={{ whiteSpace: "nowrap" }}>
                {String(c.id ?? "")}
              </div>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span
                className="muted"
                style={{
                  border: "1px solid var(--border)",
                  padding: "2px 10px",
                  borderRadius: 999,
                }}
              >
                Grading: {String(c.grading?.model ?? "mastery")}
              </span>
              <span
                className="muted"
                style={{
                  border: "1px solid var(--border)",
                  padding: "2px 10px",
                  borderRadius: 999,
                }}
              >
                Support:{" "}
                {Array.isArray(c.support?.channels) && c.support.channels.length
                  ? String(c.support.channels[0])
                  : "Help Center"}
              </span>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn" href={buildHref(1)}>
                Reset
              </Link>
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
        <Link className="btn" href={buildHref(Math.max(1, safePage - 1))} aria-disabled={safePage === 1}>
          Prev
        </Link>
        <div className="muted">
          Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, total)} of{" "}
          {total.toLocaleString()}
        </div>
        <Link className="btn" href={buildHref(Math.min(totalPages, safePage + 1))} aria-disabled={safePage === totalPages}>
          Next
        </Link>
      </div>
    </main>
  );
}
