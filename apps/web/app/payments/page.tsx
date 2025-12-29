export const metadata = { title: "Payments" };

export default function Page() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Payments</h1>
      <p style={{ opacity: 0.9, marginTop: 0 }}>Secure payments (Stripe-ready). Add live keys on Render to enable checkout.</p>
    </main>
  );
}