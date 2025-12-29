"use strict";

const express = require("express");
const cors = require("cors");

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

// Render sets PORT automatically. We respect it.
const PORT = Number(process.env.PORT || 5050);

// Stripe is OPTIONAL. If keys aren't set, payments endpoints return 503 (not crash).
let stripe = null;
try {
  const key = process.env.STRIPE_SECRET_KEY;
  if (key && key !== "disabled") {
    const Stripe = require("stripe");
    stripe = new Stripe(key);
  } else {
    console.log("[Readytolearn] Stripe not configured yet. Payments disabled until STRIPE_SECRET_KEY is set.");
  }
} catch (e) {
  console.log("[Readytolearn] Stripe init skipped:", e.message);
  stripe = null;
}

// Health
app.get("/health", (_req, res) => res.json({ ok: true, service: "readytolearn-api" }));

// In-memory courses (safe default; DB can be added later)
function makeCourses(n) {
  n = n || 300;
  const levels = ["Beginner", "Intermediate", "Advanced", "Professional"];
  const subjects = ["Math","English","Science","Technology","Business","Health","Languages","Arts","Finance","Law","Engineering"];
  const out = [];
  for (let i = 1; i <= n; i++) {
    const subject = subjects[i % subjects.length];
    const level = levels[i % levels.length];
    out.push({
      id: "course_" + i,
      title: subject + " - " + level + " Track " + i,
      subject,
      level,
      minutes: 30 + (i % 90),
      summary: "Structured learning path with practice, inclusive support, and progress tracking."
    });
  }
  return out;
}
const COURSES = makeCourses(400);

// Courses API
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

// Receipt verification (placeholder that works)
app.get("/payments/verify/:id", (req, res) => {
  const id = String(req.params.id || "");
  if (!id || id.length < 6) return res.status(400).json({ ok: false, error: "Invalid receipt id" });
  res.json({ ok: true, receipt: { id, status: "verified", note: "Endpoint live. Hook to DB/Stripe later." } });
});

// Stripe checkout (only works when Stripe is configured)
app.post("/payments/checkout", async (req, res) => {
  if (!stripe) return res.status(503).json({ ok: false, error: "Payments are not configured yet." });

  const courseId = req.body && req.body.courseId;
  const course = COURSES.find(c => c.id === courseId) || COURSES[0];

  const webBase = process.env.WEB_BASE_URL || "https://example.com";
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
      success_url: webBase + "/payments?success=1",
      cancel_url: webBase + "/payments?canceled=1",
      metadata: { courseId: course.id }
    });

    res.json({ ok: true, url: session.url, id: session.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Checkout failed." });
  }
});

// Stripe webhook placeholder
app.post("/webhooks/stripe", (_req, res) => res.status(200).send("ok"));

// 404
app.use((_req, res) => res.status(404).json({ ok: false, error: "Not found" }));

app.listen(PORT, () => console.log("Readytolearn API listening on :" + PORT));