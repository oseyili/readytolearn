import Link from "next/link";
import { COURSES } from "../courses.data";

export const dynamic = "force-static";

export default function CoursesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const PAGE_SIZE = 24;

  const page =
    typeof searchParams?.page === "string"
      ? Math.max(1, parseInt(searchParams.page, 10) || 1)
      : 1;

  const q =
    typeof searchParams?.q === "string"
      ? searchParams.q.toLowerCase().trim()
      : "";

  let results = COURSES as any[];

  if (q) {
    results = results.filter((c) =>
      `${c.title ?? ""} ${c.summary ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const items = results.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const linkFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
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

      <form style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <input
          name="q"
          placeholder="Search courses…"
          defaultValue={q}
        />
        <button className="btn primary" type="submit">
          Search
        </button>
        <Link className="btn" href="/courses">
          Reset
        </Link>
      </form>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {items.map((c) => (
          <div key={String(c.id ?? c.slug)} className="card">
            <div style={{ fontWeight: 800 }}>{c.title}</div>
            <div className="muted">{c.summary}</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Level: {c.level ?? "N/A"} • {c.minutes ?? "—"} min
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <Link className="btn" href={linkFor(Math.max(1, safePage - 1))}>
          Prev
        </Link>
        <div className="muted">
          Showing {(safePage - 1) * PAGE_SIZE + 1}–
          {Math.min(safePage * PAGE_SIZE, total)} of {total}
        </div>
        <Link className="btn" href={linkFor(Math.min(totalPages, safePage + 1))}>
          Next
        </Link>
      </div>
    </main>
  );
}
