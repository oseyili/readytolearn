import Link from "next/link";

export default function Page() {
  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Partners</div>
        <div className="muted">NGO, government, university, and employer partnerships.</div>
        <hr />
        <div className="muted" style={whiteSpace:"pre-wrap", lineHeight: 1.6}>
          Readytolearn partners with:
          • NGOs & Foundations (sponsored cohorts)
          • Governments (national skills programs)
          • Universities (bridge-to-career pathways)
          • Employers (internships and verified entry-level talent)
          
          Deployment options:
          • Readytolearn standard platform
          • Co-branded portal
          • Cohort-based delivery (country, language, accessibility focus)
          
          What partners receive:
          • Privacy-safe impact reporting
          • Completion + credential metrics
          • Optional employer placement reporting
          
          To partner, share:
          • target population
          • language(s)
          • cohort size
          • timeline
        </div>
        <div className="row" style={marginTop:16}>
          <Link className="btn primary" href="/portal">Open Learning Portal</Link>
          <Link className="btn" href="/">Home</Link>
        </div>
      </div>
    </div>
  );
}
