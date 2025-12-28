import { apiGet, API } from "../../../../../lib/api";

export default async function VerifyCert({ params }: { params: { publicId: string } }) {
  const d = await apiGet(`/certificates/verify/${params.publicId}`);
  const c = d.certificate;
  return (
    <div className="card">
      <div className="h1">Certificate Verification</div>
      <div className="muted">Share this page with employers.</div>
      <hr />
      <div className="row">
        <span className="badge">Course: {c.title}</span>
        <span className="badge">Level: {c.level}</span>
        <span className="badge">Language: {c.language}</span>
      </div>
      <div className="muted" style={{marginTop:12}}>Issued: {String(c.issued_at).slice(0,10)}</div>
      <div className="muted" style={{marginTop:6}}>Learner: {c.email}</div>
      <div className="row" style={{marginTop:14}}>
        <a className="btn primary" href={`${API}/certificates/pdf/${c.public_id}`} target="_blank">Open PDF</a>
      </div>
    </div>
  );
}
