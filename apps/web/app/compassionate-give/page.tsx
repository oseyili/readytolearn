import Link from "next/link";

export default function Page() {
  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Compassionate Give</div>
        <div className="muted">Sponsor learning ethically — with dignity, transparency, and measurable outcomes.</div>
        <hr />
        <div className="muted" style={whiteSpace:"pre-wrap", lineHeight: 1.6}>
          **Compassionate Give** lets individuals, companies, NGOs, and institutions sponsor learning for others.
          
          How it works:
          • Sponsors fund course access, certificates, subscriptions, or learning paths
          • Funds are used **only** to unlock learning on Readytolearn
          • Sponsored learners receive the **same** courses and **same** certificates
          • Sponsors receive privacy-safe impact reporting (aggregated outcomes)
          
          Why it matters:
          • Removes cost barriers without labeling learners
          • Increases completion and employment outcomes
          • Enables ethical, measurable philanthropy
          
          If you want to sponsor learners today, visit the Sponsors page.
        </div>
        <div className="row" style={marginTop:16}>
          <Link className="btn primary" href="/portal">Open Learning Portal</Link>
          <Link className="btn" href="/">Home</Link>
        </div>
      </div>
    </div>
  );
}
