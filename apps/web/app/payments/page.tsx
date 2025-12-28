export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main style={{maxWidth: 980, margin: "0 auto", padding: 24}}>
      <h1 style={{fontSize: 28, fontWeight: 700, marginBottom: 8}}>Payments</h1>
      <p style={{opacity: 0.85, marginBottom: 16}}>Secure payments (Stripe-ready). You can verify receipts and manage purchases.</p>
      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12}}>
        <section style={{border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 14}}>
          <h2 style={{fontSize: 16, fontWeight: 650, marginBottom: 6}}>What you can do here</h2>
          <ul style={{lineHeight: 1.6, paddingLeft: 18, margin: 0}}>
            <li>Browse and learn safely (no copyrighted material).</li>
            <li>Track progress and earn certificates (paid option).</li>
            <li>Access inclusive learning support and accessibility features.</li>
          </ul>
        </section>
        <section style={{border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 14}}>
          <h2 style={{fontSize: 16, fontWeight: 650, marginBottom: 6}}>Support</h2>
          <p style={{opacity: 0.85, margin: 0}}>
            If something looks wrong, refresh once. If it persists, it will be fixed in the next deploy.
          </p>
        </section>
      </div>
    </main>
  );
}