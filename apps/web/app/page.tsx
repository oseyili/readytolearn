export default function Page() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 34, margin: "0 0 8px" }}>Welcome to Readytolearn</h1>
      <p style={{ fontSize: 16, opacity: 0.9, marginTop: 0 }}>
        Learn any subject, at any level, in any language — with inclusive support systems and career pathways.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 16 }}>
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14 }}>
          <h2 style={{ marginTop: 0 }}>Learners</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Beginner to professional learning tracks</li>
            <li>Accessible design for disability and SEN learners</li>
            <li>Certificates (paid option) with verifiable receipts</li>
          </ul>
        </section>

        <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14 }}>
          <h2 style={{ marginTop: 0 }}>Support</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Compassionate Give: sponsor others to learn</li>
            <li>Partners: training + internships + job pathways</li>
            <li>Investor-ready narrative and metrics pages</li>
          </ul>
        </section>
      </div>
    </main>
  );
}