import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Readytolearn — Master Portal",
  description: "Role-aware master portal with accessibility-first UX.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}
        <footer style={{padding:24, opacity:0.9}}>
          <div className="row">
            <a className="btn" href="/about">About</a>
            <a className="btn" href="/compassionate-give">Compassionate Give</a>
            <a className="btn" href="/partners">Partners</a>
            <a className="btn" href="/investors">Investors</a>
            <a className="btn" href="/legal/terms">Terms</a>
            <a className="btn" href="/legal/privacy">Privacy</a>
          </div>
          <div className="muted" style={{marginTop:10}}>Readytolearn • Built for inclusive learning and real opportunity.</div>
        </footer></body>
    </html>
  );
}
