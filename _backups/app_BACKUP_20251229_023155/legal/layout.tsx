import Link from "next/link";
import { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container">
      <div className="row" style={{ justifyContent:"space-between", marginBottom: 14  }}>
        <Link href="/" className="badge">Readytolearn</Link>
        <div className="row">
          <Link className="btn" href="/legal/terms">Terms</Link>
          <Link className="btn" href="/legal/privacy">Privacy</Link>
          <Link className="btn" href="/legal/accessibility">Accessibility</Link>
        </div>
      </div>
      {children}
    </div>
  );
}

