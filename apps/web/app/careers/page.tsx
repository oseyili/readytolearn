import Link from "next/link";

export default function Page() {
  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Careers</div>
        <div className="muted">Join the mission: accessible learning + real opportunity.</div>
        <hr />
        <div className="muted" style={whiteSpace:"pre-wrap", lineHeight: 1.6}>
          We are building an inclusive, global learning platform.
          
          Areas we hire for (as we scale):
          • Full-stack engineering (Node, Next.js, React Native/Expo)
          • Accessibility & inclusive design
          • Curriculum & assessment design (original content)
          • Partnerships (NGO/Gov/Employer)
          • Trust & safety / moderation
          
          If you want to join, send:
          • your role interest
          • portfolio or LinkedIn
          • location/timezone
        </div>
        <div className="row" style={marginTop:16}>
          <Link className="btn primary" href="/portal">Open Learning Portal</Link>
          <Link className="btn" href="/">Home</Link>
        </div>
      </div>
    </div>
  );
}
