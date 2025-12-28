import Link from "next/link";

export default function Page() {
  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Investors</div>
        <div className="muted">Investor overview: defensible, scalable, ethical learning infrastructure.</div>
        <hr />
        <div className="muted" style={whiteSpace:"pre-wrap", lineHeight: 1.6}>
          Readytolearn is positioned as **global learning + workforce infrastructure**:
          • AI-native learning companion + course creation tools
          • Accessibility-first (WCAG-aligned + SEN-friendly)
          • Multi-language global reach
          • Verified certificates (public verification + PDF)
          • Employer & internship pathways
          • Compassionate Give: ethical sponsorship + measurable outcomes
          
          Revenue streams:
          • Certificates (paid)
          • Subscriptions
          • Employer access & pipelines
          • Institutional deployments (NGO/Gov/Enterprise)
          • Licensing / white-label
          
          Why we win:
          • AI as the operating system (not a bolt-on)
          • Accessibility as core architecture
          • Outcomes: learning → credentials → employment
          • Ethical sponsorship increases reach and reduces CAC
          
          If you are an investor, contact us with:
          • sector focus (EdTech/AI/Impact)
          • ticket size
          • geography
          • preferred diligence timeline
        </div>
        <div className="row" style={marginTop:16}>
          <Link className="btn primary" href="/portal">Open Learning Portal</Link>
          <Link className="btn" href="/">Home</Link>
        </div>
      </div>
    </div>
  );
}
