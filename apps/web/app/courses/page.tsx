import Link from "next/link";
import { COURSES } from "./courses.data";

export const dynamic = "force-static";

export default function CoursesPage({
  searchParams,
}: {
  searchParams?: { page?: string; q?: string; track?: string; level?: string };
}) {
  const PAGE_SIZE = 24;

  const page = Math.max(1, Number(searchParams?.page ?? "1"));
  const q = (searchParams?.q ?? "").toLowerCase().trim();
  const track = (searchParams?.track ?? "").trim();
  const level = (searchParams?.level ?? "").trim();

  let results = COURSES as any[];

  if (track) results = results.filter((c) => c.track === track);
  if (level) results = results.filter((c) => c.level === level);
  if (q) {
    results = results.filter((c) =>
      `${c.title} ${c.summary}`.toLowerCase().includes(q)
    );
  }

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageItems = results.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const linkFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", searchParams?.q ?? "");
    if (track) params.set("track", track);
    if (level) params.set("level", level);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/courses?${s}` : "/courses";
  };

  return (
    <main className="card">
      <div className="h1">Courses</div>
      <div className="muted">
        {total.toLocaleString()} courses • Page {safePage} of {totalPages}
      </div>
      <hr />

      <form
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 200px 200px 140px",
          gap: 10,
        }}
      >
        <input name="q" placeholder="Search courses…" defaultValue={searchParams?.q ?? ""} />
        <input name="track" placeholder="Track" defaultValue={track} />
        <input name="level" placeholder="Level" defaultValue={level} />
        <button className="btn primary">Filter</button>
      </form>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {pageItems.map((c) => (
          <div key={c.id} className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 800 }}>{c.title}</div>
            <div className="muted">{c.summary}</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Track: {c.track} • Level: {c.level} • {c.minutes ?? c.durationMinutes} min
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16,
          gap: 10,
        }}
      >
        <Link className="btn" href={linkFor(Math.max(1, safePage - 1))} aria-disabled={safePage === 1}>
          Prev
        </Link>

        <div className="muted">
          Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, total)} of{" "}
          {total.toLocaleString()}
        </div>

        <Link className="btn" href={linkFor(Math.min(totalPages, safePage + 1))} aria-disabled={safePage === totalPages}>
          Next
        </Link>
      </div>
    </main>
  );
}
