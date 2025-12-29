import Link from "next/link";

export default function Home() {
  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Readytolearn</div>
        <div className="muted">A modern, inclusive, AI-assisted learning platform with real career outcomes.</div>
        <hr />
        <div className="row">
          <Link className="btn primary" href="/portal">Open Learning Portal</Link>
          <Link className="btn" href="/about">About</Link>
          <Link className="btn" href="/compassionate-give">Compassionate Give</Link>
          <Link className="btn" href="/sponsors">Sponsors</Link>
          <Link className="btn" href="/partners">Partners</Link>
          <Link className="btn" href="/investors">Investors</Link>
          <Link className="btn" href="/legacy-giving">Legacy Giving</Link>
          <Link className="btn" href="/legacy-intent">Legacy Intent</Link>
          <Link className="btn" href="/careers">Careers</Link>
          <Link className="btn" href="/legal/terms">Terms</Link>
          <Link className="btn" href="/legal/privacy">Privacy</Link>
          <Link className="btn" href="/legal/accessibility">Accessibility</Link>
        </div>
      </div>

      <div className="card col-12">
        <div className="h2">What you can do today</div>
        <div className="muted" style={{ lineHeight: 1.6  }}>
          Browse courses, learn with support, earn certificates, and share verifiable credentials with employers.
          Sponsors can fund learning through Compassionate Give â€” ethically and transparently.
        </div>
      </div>
    </div>
  );
}

