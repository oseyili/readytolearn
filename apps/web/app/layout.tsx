export const metadata = {
  title: "Readytolearn",
  description: "Inclusive, AI-powered learning and opportunity."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
        <header style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", gap: 14, alignItems: "center" }}>
            <a href="/" style={{ fontWeight: 800, textDecoration: "none", color: "#111827" }}>Readytolearn</a>
            <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/courses">Courses</a>
              <a href="/payments">Payments</a>
              <a href="/verify-receipt">Verify Receipt</a>
              <a href="/compassionate-give">Compassionate Give</a>
              <a href="/partners">Partners</a>
              <a href="/investors">Investors</a>
              <a href="/about">About</a>
              <a href="/terms">Terms</a>
              <a href="/privacy">Privacy</a>
            </nav>
          </div>
        </header>
        {children}
        <footer style={{ padding: 16, borderTop: "1px solid #e5e7eb", marginTop: 24 }}>
          <div style={{ maxWidth: 980, margin: "0 auto", opacity: 0.85 }}>
            Readytolearn • Built for inclusive learning and real opportunity.
          </div>
        </footer>
      </body>
    </html>
  );
}