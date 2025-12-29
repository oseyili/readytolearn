import Link from "next/link";

export default function Portal() {
  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Dashboard</div>
        <div className="muted">Password reset, email verification, referrals, certificates, admin course builder.</div>
        <hr />
        <div className="row">
          <Link className="btn primary" href="/portal/auth">Login / Register</Link>
          <Link className="btn" href="/portal/courses">Courses</Link>
          <Link className="btn" href="/portal/payments">Payments</Link>
          <Link className="btn" href="/portal/certificates">Certificates</Link>
          <Link className="btn" href="/portal/referrals">Referrals</Link>
          <Link className="btn" href="/portal/sponsorships">Sponsorship Support</Link>
          <Link className="btn" href="/portal/admin">Admin</Link>
        </div>
      </div>
    </div>
  );
}
