import Link from "next/link";
import { ReactNode } from "react";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container">
      <div className="row" style={{ justifyContent:"space-between", marginBottom: 14  }}>
        <div className="row">
          <Link href="/" className="badge">Readytolearn</Link>
          <span className="muted">Master Portal</span>
        </div>
        <div className="row">
          <Link className="btn" href="/portal">Dashboard</Link>
          <Link className="btn" href="/portal/auth">Login</Link>
          <Link className="btn" href="/portal/courses">Courses</Link>
          <Link className="btn" href="/portal/learn">Learn</Link>
          <Link className="btn" href="/portal/skills">My Skills</Link>
          <Link className="btn" href="/portal/opportunities">Opportunities</Link>
          <Link className="btn" href="/portal/payments">Payments</Link>
          <Link className="btn" href="/portal/support">Support</Link>
          <Link className="btn" href="/portal/referrals">Referrals</Link>
          <Link className="btn" href="/portal/sponsorships">Sponsorship Support</Link>
          <Link className="btn" href="/portal/certificates">Certificates</Link>
          <Link className="btn" href="/portal/admin">Admin</Link>
          <Link className="btn" href="/portal/settings">Accessibility</Link>
        </div>
      </div>
      {children}
    </div>
  );
}

