import Link from "next/link";
import { COURSES } from "./courses.data";

export const dynamic = "force-static";

function toStr(v: unknown) {
  return typeof v === "string" ? v : "";
}

export default function CoursesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const PAGE_SIZE = 24;

  const qRaw = toStr(searchParams?.q);
  const trackRaw = toStr(searchParams?.track);
  const levelRaw = toStr(searchParams?.level);
  const pageRaw = toStr(searchParams?.page);

  const q = qRaw.toLowerCase().trim();
  const track = trackRaw.trim();
  const level = levelRaw.trim();
  const page = Math.max(1, Number(pageRaw || "1") || 1);

  let results: any[] = COURSES as any[];

  if (track) results = results.filter((c) => String(c.track) === track);
  if (level) results = results.filter((c) => String(c.level) === level);
  if (q) {
    results = results.filter((c) =>
      `${c.title ?? ""} ${c.summary ?? ""}`.toLowerCase().includes(q)
    );
  }

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const items = results.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (qRaw) params.set("q", qRaw);
    if (trackRaw) params.set("track", trackRaw);
    if (levelRaw) params.set("level", levelRaw);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/courses?${s}` : "/courses";
  };

  return (
    <main className="card">
      <div className="h1">Courses</div>
      <div className="muted">
        {total.toLocaleString()} course(s) • Page {safePage} / {totalPages}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <form style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input name="q" placeholder="Search…" defaultValue={qRaw} />
          <input name="track" placeholder="Track" defaultValue={trackRaw} />
          <input name="level" placeholder="Level" defaultValue={levelRaw} />
          <button className="btn primary" type="submit">Filter</button>
          <Link className="btn" href="/courses">Reset</Link>
        </form>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {items.map((c) => (
          <div key={String(c.id ?? c.slug)} className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 800 }}>{String(c.title ?? "Untitled")}</div>
            <div className="muted">{String(c.summary ?? "")}</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Track: {String(c.track ?? "n/a")} • Level: {String(c.level ?? "n/a")} •{" "}
              {String(c.minutes ?? c.durationMinutes ?? "n/a")} min
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <Link className="btn" href={href(Math.max(1, safePage - 1))} aria-disabled={safePage === 1}>
          Prev
        </Link>
        <div className="muted">
          Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, total)} of{" "}
          {total.toLocaleString()}
        </div>
        <Link className="btn" href={href(Math.min(totalPages, safePage + 1))} aria-disabled={safePage === totalPages}>
          Next
        </Link>
      </div>
    </main>
  );
}
