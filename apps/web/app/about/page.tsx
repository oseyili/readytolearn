import Link from "next/link";

export default function Page() {
  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">About Readytolearn</div>
        <div className="muted">Inclusive, AI-powered learning + career opportunity.</div>
        <hr />
        <div className="muted" style={whiteSpace:"pre-wrap", lineHeight: 1.6}>
          Readytolearn is a modern, AI‑assisted learning platform built for **everyone** — from beginners to professionals — with accessibility and dignity as first principles.
          
          What makes Readytolearn different:
          • **AI Learning Companion** (simple/standard/professional explanations)
          • **Accessibility-first** design (SEN-friendly, calm mode, dyslexia-friendly)
          • **Global by default** (multi-language support)
          • **Verified certificates** with shareable verification pages
          • **Career outcomes** (internships, training, on-the-job opportunities)
          • **Compassionate Give** sponsorship so people can fund learning for others
          
          Readytolearn does not use copyrighted course material. Content is created as original learning guidance and can be reviewed and moderated.
        </div>
        <div className="row" style={marginTop:16}>
          <Link className="btn primary" href="/portal">Open Learning Portal</Link>
          <Link className="btn" href="/">Home</Link>
        </div>
      </div>
    </div>
  );
}
