import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT || 5050);

/**
 * Stripe is OPTIONAL at first deploy.
 * If STRIPE_SECRET_KEY is missing, payment routes return a clean 503 instead of crashing.
 */
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "disabled") {
  const Stripe = (await import("stripe")).default;
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
} else {
  console.warn("[Readytolearn] Stripe not configured yet. Payments disabled until STRIPE_SECRET_KEY is set.");
}

/** Basic health */
app.get("/health", (_req, res) => res.json({ ok: true, service: "readytolearn-api" }));

/** Simple in-memory courses (safe default). Replace with DB later. */
function makeCourses(n=200) {
  const levels = ["Beginner","Intermediate","Advanced","Professional"];
  const subjects = ["Math","English","Science","Technology","Business","Health","Languages","Arts","Finance","Law","Engineering"];
  const out = [];
  for (let i=1;i<=n;i++){
    const subject = subjects[i % subjects.length];
    const level = levels[i % levels.length];
    out.push({
      id: "course_" + i,
      title: subject + " - " + level + " Track " + i,
      subject,
      level,
      minutes: 30 + (i % 90),
      summary: "A structured learning path with practice, support, and progress tracking.",
    });
  }
  return out;
}
const COURSES = makeCourses(400);

/** Courses */
app.get("/courses", (req, res) => {
  const q = String(req.query.q || "").toLowerCase().trim();
  const level = String(req.query.level || "").toLowerCase().trim();
  const subject = String(req.query.subject || "").toLowerCase().trim();

  let rows = COURSES;
  if (q) rows = rows.filter(c => (c.title + " " + c.summary).toLowerCase().includes(q));
  if (level) rows = rows.filter(c => c.level.toLowerCase() === level);
  if (subject) rows = rows.filter(c => c.subject.toLowerCase() === subject);

  res.json({ ok: true, count: rows.length, courses: rows.slice(0, 200) });
});

/** Receipt verification (placeholder that works). */
app.get("/payments/verify/:id", (req, res) => {
  const id = String(req.params.id || "");
  // For now: treat any non-empty id as "found" format. Replace with DB lookup later.
  if (!id || id.length < 6) return res.status(400).json({ ok:false, error:"Invalid receipt id" });
  res.json({ ok:true, receipt:{ id, status:"verified", note:"Verification endpoint live. Hook to DB/Stripe later." } });
});

/** Stripe checkout session (only works once Stripe is configured) */
app.post("/payments/checkout", async (req, res) => {
  if (!stripe) return res.status(503).json({ ok:false, error:"Payments are not configured yet." });

  const { courseId } = req.body || {};
  const course = COURSES.find(c => c.id === courseId) || COURSES[0];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: 1999,
          product_data: { name: "Readytolearn - " + course.title }
        }
      }],
      success_url: (process.env.WEB_BASE_URL || "https://example.com") + "/payments?success=1",
      cancel_url: (process.env.WEB_BASE_URL || "https://example.com") + "/payments?canceled=1",
      metadata: { courseId: course.id }
    });

    res.json({ ok:true, url: session.url, id: session.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:"Checkout failed." });
  }
});

/** Webhook endpoint placeholder */
app.post("/webhooks/stripe", (req, res) => {
  // Implement signature verification when STRIPE_WEBHOOK_SECRET is set.
  res.status(200).send("ok");
});

/** Safe 404 */
app.use((_req, res) => res.status(404).json({ ok:false, error:"Not found" }));

app.listen(PORT, () => console.log("Readytolearn API listening on :" + PORT));