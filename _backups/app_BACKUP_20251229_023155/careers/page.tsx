import Link from "next/link";

export default function Page() {
  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Careers</div>
        <div className="muted">Join the mission: accessible learning + real opportunity.</div>
        <hr />
        <div className="muted" style={{  whiteSpace: "pre-wrap", lineHeight: 1.6   }}>
          We are building an inclusive, global learning platform.
          
          Areas we hire for (as we scale):
          â€¢ Full-stack engineering (Node, Next.js, React Native/Expo)
          â€¢ Accessibility & inclusive design
          â€¢ Curriculum & assessment design (original content)
          â€¢ Partnerships (NGO/Gov/Employer)
          â€¢ Trust & safety / moderation
          
          If you want to join, send:
          â€¢ your role interest
          â€¢ portfolio or LinkedIn
          â€¢ location/timezone
        </div>
        <div className="row" style={{  marginTop: 16   }}>
          <Link className="btn primary" href="/portal">Open Learning Portal</Link>
          <Link className="btn" href="/">Home</Link>
        </div>
      </div>
    </div>
  );
}



