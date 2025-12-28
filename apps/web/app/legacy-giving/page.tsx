import Link from "next/link";

export default function LegacyGiving() {
  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Legacy Giving</div>
        <div className="muted">Support learning beyond your lifetime (optional).</div>
        <hr />
        <div className="muted" style={{whiteSpace:"pre-wrap", lineHeight: 1.7}}>
          Legacy Giving lets you choose to leave a gift in your will (or estate plan) to support learning access on Readytolearn.

          What legacy gifts can support:
          • Compassionate Give sponsorships (courses, certificates, subscriptions)
          • Accessibility programs and inclusive learning support
          • Long-term learning access funds

          What Readytolearn can and cannot do:
          • ✅ We can provide general information and sample wording templates
          • ✅ We can provide verified recipient/organization details for your executor/solicitor
          • ❌ We do not draft wills
          • ❌ We do not provide legal or tax advice
          • ❌ We do not act as executor or manage estates
          • ❌ We do not accept custody of assets from living donors

          Important (legal): Laws vary by country and region. Please consult a qualified solicitor/attorney or licensed estate professional before signing or updating any will or trust.

          Download sample wording templates (PDF):
        </div>

        <div className="row" style={{marginTop:16}}>
          <a className="btn primary" href="/legacy/Readytolearn_Legacy_Giving_Templates.pdf" target="_blank" rel="noreferrer">
            Download templates (PDF)
          </a>
          <Link className="btn" href="/legacy-intent">I intend to leave a legacy gift</Link>
          <Link className="btn" href="/verify-receipt">Verify a receipt</Link>
          <Link className="btn" href="/sponsors">Sponsor learning today</Link>
          <Link className="btn" href="/compassionate-give">Learn about Compassionate Give</Link>
          <Link className="btn" href="/">Home</Link>
        </div>
      </div>

      <div className="card col-12">
        <div className="h2">Executor / solicitor instructions</div>
        <div className="muted" style={{lineHeight: 1.7}}>
          <div>Executors may contact Readytolearn for recipient details and remittance references:</div>
          <div style={{marginTop:8}}><b>legacy@readytolearn.example</b> (replace with your official email)</div>
          <div>Include: “Legacy Gift — Readytolearn” as the payment reference</div>
        </div>
      </div>
    </div>
  );
}
