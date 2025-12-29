import { apiGet } from "../../../lib/api";

export default async function Courses() {
  const data = await apiGet("/courses");
  return (
    <div className="card">
      <div className="h1">Courses</div>
      <div className="muted">Live list from API. Expand subjects/languages via admin later.</div>
      <hr />
      <div className="grid">
        {data.courses.map((c: any) => (
          <div key={c.id} className="card col-6" style={{ background:"var(--surface2)"  }}>
            <div className="h2">{c.title}</div>
            <div className="row">
              <span className="badge">{c.level}</span>
              <span className="badge">{c.language}</span>
              <span className="badge">{c.is_free ? "Free" : "Premium"}</span>
            </div>
            <div className="muted" style={{ marginTop:10  }}>{c.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

