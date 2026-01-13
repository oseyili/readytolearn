import cors from "cors";
import express from "express";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { pool } from "./db/pool.js";
import * as esbuild from "esbuild";
import Stripe from "stripe";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2023-10-16" }) : null;

function mustBeAdmin(req, res) {
  const token = process.env.ADMIN_IMPORT_TOKEN;

  if (!token && process.env.NODE_ENV === "production") {
    res.status(403).json({ ok: false, error: "ADMIN_IMPORT_TOKEN not set" });
    return false;
  }
  if (!token) return true;

  const got = req.headers["x-admin-token"] || req.query.token;
  if (got !== token) {
    res.status(403).json({ ok: false, error: "forbidden" });
    return false;
  }
  return true;
}

function normText(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normKey(s) {
  return normText(s).toLowerCase();
}

function slugify(s) {
  return normKey(s)
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stableUuidFromKey(key) {
  // deterministic UUID-like from sha1 (good enough for stable IDs)
  return crypto
    .createHash("sha1")
    .update(key)
    .digest("hex")
    .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*$/, "$1-$2-$3-$4-$5");
}

// Track -> master subject area mapping (edit anytime; no duplicates, professional taxonomy)
function mapToMasterSubject(course) {
  const track = normKey(course?.track || course?.subject || course?.category || course?.area || "");
  const title = normKey(course?.title || course?.name || "");

  const rules = [
    { subject: "Digital Foundations", match: ["digital", "computer", "literacy", "internet", "email"] },
    { subject: "AI & Data", match: ["ai", "data", "machine", "analytics"] },
    { subject: "Math", match: ["algebra", "math", "numeracy", "calculus"] },
    { subject: "Business & Career", match: ["career", "internship", "customer-support", "support", "work", "employ", "cv", "interview"] },
    { subject: "Software & Coding", match: ["code", "program", "developer", "javascript", "python", "web-dev"] },
    { subject: "Finance", match: ["finance", "account", "budget", "invest"] },
    { subject: "Health & Wellbeing", match: ["health", "wellbeing", "mental"] },
    { subject: "Language & Communication", match: ["english", "writing", "communication", "language"] },
  ];

  const hay = `${track} ${title}`;
  for (const r of rules) {
    if (r.match.some((m) => hay.includes(m))) return r.subject;
  }

  // fallback: if a track exists, use a cleaned version, else General
  const fallback = normText(course?.track || course?.subject || course?.category || "");
  return fallback ? fallback : "General";
}

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id uuid PRIMARY KEY,
      title text NOT NULL,
      subject text NOT NULL,
      subject_slug text NOT NULL,
      level text NOT NULL,
      language text NOT NULL,
      description text NOT NULL,
      is_free boolean NOT NULL DEFAULT false,
      source text NOT NULL DEFAULT 'import',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS courses_unique_key
    ON courses (lower(title), lower(subject));
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id uuid PRIMARY KEY,
      learner_id text NOT NULL,
      course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (learner_id, course_id)
    );
  `);
}

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/subjects", async (req, res) => {
  try {
    await ensureTables();
    const r = await pool.query(`
      SELECT subject, subject_slug, COUNT(*)::int AS count
      FROM courses
      GROUP BY subject, subject_slug
      ORDER BY count DESC, subject ASC;
    `);

    // Ensure no repeats by slug
    const bySlug = new Map();
    for (const row of r.rows) {
      const slug = row.subject_slug;
      const prev = bySlug.get(slug);
      if (!prev) bySlug.set(slug, { subject: row.subject, slug, count: row.count });
      else prev.count += row.count;
    }

    const subjects = Array.from(bySlug.values()).sort((a, b) => b.count - a.count || a.subject.localeCompare(b.subject));
    res.json({ ok: true, subjects });
  } catch (e) {
    console.error("GET /subjects error:", e);
    res.status(500).json({ ok: false, error: "db_error" });
  }
});

app.get("/courses", async (req, res) => {
  try {
    await ensureTables();

    const limitRaw = Number(req.query.limit ?? 60);
    const offsetRaw = Number(req.query.offset ?? 0);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 60;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    const subjectSlug = normText(req.query.subject || "");
    const q = normText(req.query.q || "");

    const where = [];
    const params = [];
    let i = 1;

    if (subjectSlug) {
      where.push(`subject_slug = $${i++}`);
      params.push(subjectSlug);
    }
    if (q) {
      where.push(`(title ILIKE $${i} OR description ILIKE $${i} OR subject ILIKE $${i})`);
      params.push(`%${q}%`);
      i++;
    }

    params.push(limit, offset);
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const list = await pool.query(
      `
      SELECT id, title, subject, subject_slug, level, language, description, is_free, created_at
      FROM courses
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${i++} OFFSET $${i++};
      `,
      params
    );

    const total = await pool.query(`SELECT COUNT(*)::int AS n FROM courses;`);
    res.json({ ok: true, courses: list.rows, total: total.rows[0].n, limit, offset });
  } catch (e) {
    console.error("GET /courses error:", e);
    res.status(500).json({ ok: false, error: "db_error" });
  }
});

app.post("/enroll", async (req, res) => {
  try {
    await ensureTables();
    const learnerId = normText(req.body?.learnerId || "");
    const courseId = normText(req.body?.courseId || "");
    if (!learnerId || !courseId) return res.status(400).json({ ok: false, error: "learnerId and courseId required" });

    const check = await pool.query(`SELECT 1 FROM courses WHERE id=$1`, [courseId]);
    if (check.rowCount === 0) return res.status(404).json({ ok: false, error: "course_not_found" });

    await pool.query(
      `INSERT INTO enrollments (id, learner_id, course_id)
       VALUES ($1,$2,$3)
       ON CONFLICT (learner_id, course_id) DO NOTHING;`,
      [crypto.randomUUID(), learnerId, courseId]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("POST /enroll error:", e);
    res.status(500).json({ ok: false, error: "db_error" });
  }
});

app.get("/enrollments", async (req, res) => {
  try {
    await ensureTables();
    const learnerId = normText(req.query.learnerId || "");
    if (!learnerId) return res.status(400).json({ ok: false, error: "learnerId required" });

    const r = await pool.query(
      `SELECT e.course_id, e.created_at, c.title, c.subject, c.subject_slug, c.level, c.language, c.is_free
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.learner_id = $1
       ORDER BY e.created_at DESC;`,
      [learnerId]
    );

    res.json({ ok: true, enrollments: r.rows });
  } catch (e) {
    console.error("GET /enrollments error:", e);
    res.status(500).json({ ok: false, error: "db_error" });
  }
});

// --------- PAYMENTS (Stripe Checkout) ---------
app.post("/payments/create-checkout", async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ ok: false, error: "STRIPE_SECRET_KEY not set" });
    await ensureTables();

    const learnerId = normText(req.body?.learnerId || "");
    const courseId = normText(req.body?.courseId || "");
    if (!learnerId || !courseId) return res.status(400).json({ ok: false, error: "learnerId and courseId required" });

    const course = await pool.query(`SELECT id, title, is_free FROM courses WHERE id=$1`, [courseId]);
    if (course.rowCount === 0) return res.status(404).json({ ok: false, error: "course_not_found" });
    if (course.rows[0].is_free) return res.status(400).json({ ok: false, error: "course_is_free" });

    const webBase = process.env.WEB_BASE_URL || "https://readytolearn-web.onrender.com";
    const title = course.rows[0].title;

    // Default: £9.99 (editable later)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: title },
            unit_amount: 999,
          },
          quantity: 1,
        },
      ],
      success_url: `${webBase}/payments/success?courseId=${encodeURIComponent(courseId)}&learnerId=${encodeURIComponent(learnerId)}`,
      cancel_url: `${webBase}/payments/cancel`,
      metadata: { courseId, learnerId },
    });

    res.json({ ok: true, url: session.url });
  } catch (e) {
    console.error("POST /payments/create-checkout error:", e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// --------- ADMIN: Replace + import (NO DUPLICATES EVER) ---------
async function loadWebCoursesArray() {
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const coursesTs = path.join(repoRoot, "apps", "web", "app", "courses", "courses.data.ts");
  const source = await fs.readFile(coursesTs, "utf8");

  const transformed = await esbuild.transform(source, {
    loader: "ts",
    format: "esm",
    target: "es2022",
    sourcemap: false,
  });

  const dataUrl = `data:text/javascript;base64,${Buffer.from(transformed.code).toString("base64")}`;
  const mod = await import(dataUrl);
  const arr = mod.COURSES || mod.default || [];
  if (!Array.isArray(arr) || arr.length === 0) throw new Error("Expected export const COURSES = [...]");
  return arr;
}

app.post("/admin/replace-web-courses", async (req, res) => {
  if (!mustBeAdmin(req, res)) return;

  try {
    await ensureTables();

    // FK-safe wipe (stops duplicates forever)
    await pool.query(`TRUNCATE TABLE enrollments, courses RESTART IDENTITY CASCADE;`);

    const webCourses = await loadWebCoursesArray();

    let inserted = 0;
    for (const c of webCourses) {
      const title = normText(c.title || c.name || "");
      if (!title) continue;

      const subject = normText(mapToMasterSubject(c));
      const subject_slug = slugify(subject);
      const description = normText(c.summary || c.description || "") || "No description";
      const level = normKey(c.level || c.difficulty || "beginner") || "beginner";
      const language = normKey(c.language || "en") || "en";
      const is_free = Boolean(c.is_free ?? c.free ?? false);

      // stable ID prevents duplicates even if re-imported
      const key = `${normKey(title)}::${normKey(subject)}`;
      const id = stableUuidFromKey(key);

      await pool.query(
        `INSERT INTO courses (id, title, subject, subject_slug, level, language, description, is_free, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'import')
         ON CONFLICT (lower(title), lower(subject)) DO UPDATE SET
           subject_slug=EXCLUDED.subject_slug,
           level=EXCLUDED.level,
           language=EXCLUDED.language,
           description=EXCLUDED.description,
           is_free=EXCLUDED.is_free,
           source='import';`,
        [id, title, subject, subject_slug, level, language, description, is_free]
      );

      inserted++;
    }

    const total = await pool.query(`SELECT COUNT(*)::int AS n FROM courses;`);
    res.json({ ok: true, inserted, total: total.rows[0].n });
  } catch (e) {
    console.error("POST /admin/replace-web-courses error:", e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.use((req, res) => res.status(404).json({ ok: false, error: "Not found" }));

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`API listening on ${port}`));
