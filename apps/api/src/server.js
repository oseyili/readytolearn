import cors from "cors";
import express from "express";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { pool } from "./db/pool.js";
import * as esbuild from "esbuild";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function mustBeAdmin(req, res) {
  const token = process.env.ADMIN_IMPORT_TOKEN;

  // production must have a token
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

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id uuid PRIMARY KEY,
      title text NOT NULL,
      subject text NOT NULL DEFAULT 'General',
      level text NOT NULL,
      language text NOT NULL,
      description text NOT NULL,
      is_free boolean NOT NULL DEFAULT false,
      source text NOT NULL DEFAULT 'import',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS subject text NOT NULL DEFAULT 'General';`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'import';`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id uuid PRIMARY KEY,
      learner_id uuid NOT NULL,
      course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (learner_id, course_id)
    );
  `);
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/subjects", async (req, res) => {
  try {
    await ensureTables();
    const r = await pool.query(`
      SELECT subject, COUNT(*)::int AS count
      FROM courses
      GROUP BY subject
      ORDER BY count DESC, subject ASC;
    `);

    // de-duplicate by subject in case of whitespace/case differences
    const map = new Map();
    for (const row of r.rows) {
      const key = String(row.subject || "General").trim();
      const prev = map.get(key);
      map.set(key, (prev || 0) + Number(row.count || 0));
    }

    const subjects = Array.from(map.entries())
      .map(([subject, count]) => ({ subject, count, slug: slugify(subject) }))
      .sort((a, b) => b.count - a.count || a.subject.localeCompare(b.subject));

    res.json({ ok: true, subjects });
  } catch (e) {
    console.error("GET /subjects error:", e);
    res.status(500).json({ ok: false, error: "db_error" });
  }
});

app.get("/courses", async (req, res) => {
  try {
    await ensureTables();

    const limitRaw = Number(req.query.limit ?? 200);
    const offsetRaw = Number(req.query.offset ?? 0);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 5000) : 200;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    const subjectQ = String(req.query.subject || "").trim();
    const searchQ = String(req.query.q || "").trim();

    const where = [];
    const params = [];
    let i = 1;

    if (subjectQ) {
      where.push(`(lower(regexp_replace(regexp_replace(subject,'&','and','g'),'[^a-zA-Z0-9]+','-','g')) = lower($${i}) OR lower(subject)=lower($${i+1}))`);
      params.push(subjectQ, subjectQ);
      i += 2;
    }

    if (searchQ) {
      where.push(`(title ILIKE $${i} OR description ILIKE $${i+1} OR subject ILIKE $${i+2})`);
      params.push(`%${searchQ}%`, `%${searchQ}%`, `%${searchQ}%`);
      i += 3;
    }

    params.push(limit, offset);

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const list = await pool.query(
      `
      SELECT id, title, subject, level, language, description, is_free, source, created_at
      FROM courses
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${i} OFFSET $${i+1};
      `,
      params
    );

    const count = await pool.query(`SELECT COUNT(*)::int AS n FROM courses;`);
    res.json({ ok: true, courses: list.rows, total: count.rows[0].n, limit, offset });
  } catch (e) {
    console.error("GET /courses error:", e);
    res.status(500).json({ ok: false, error: "db_error" });
  }
});

app.post("/enroll", async (req, res) => {
  try {
    await ensureTables();

    const learnerId = String(req.body?.learnerId || "");
    const courseId = String(req.body?.courseId || "");
    if (!learnerId || !courseId) return res.status(400).json({ ok: false, error: "learnerId and courseId required" });

    const check = await pool.query(`SELECT 1 FROM courses WHERE id=$1`, [courseId]);
    if (check.rowCount === 0) return res.status(404).json({ ok: false, error: "course_not_found" });

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO enrollments (id, learner_id, course_id)
       VALUES ($1,$2,$3)
       ON CONFLICT (learner_id, course_id) DO NOTHING;`,
      [id, learnerId, courseId]
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
    const learnerId = String(req.query.learnerId || "");
    if (!learnerId) return res.status(400).json({ ok: false, error: "learnerId required" });

    const r = await pool.query(
      `SELECT e.course_id, e.created_at,
              c.title, c.subject, c.level, c.language, c.is_free
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

# ADMIN: delete ONLY the numbered junk courses (keeps real ones)
app.post("/admin/purge-numbered-courses", async (req, res) => {
  if (!mustBeAdmin(req, res)) return;

  try {
    await ensureTables();

    // remove enrollments referencing numbered courses, then remove numbered courses
    await pool.query(`
      DELETE FROM enrollments
      WHERE course_id IN (
        SELECT id FROM courses WHERE title ~* '^course[[:space:]]+[0-9]+$'
      );
    `);

    const del = await pool.query(`
      DELETE FROM courses
      WHERE title ~* '^course[[:space:]]+[0-9]+$'
      RETURNING id;
    `);

    const count = await pool.query(`SELECT COUNT(*)::int AS n FROM courses;`);
    res.json({ ok: true, deleted_numbered: del.rowCount, total_remaining: count.rows[0].n });
  } catch (e) {
    console.error("POST /admin/purge-numbered-courses error:", e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

# ADMIN: import from apps/web/app/courses/courses.data.ts (export const COURSES = [...])
app.post("/admin/import-web-courses", async (req, res) => {
  if (!mustBeAdmin(req, res)) return;

  try {
    await ensureTables();

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

    const webCourses = mod.COURSES || [];
    if (!Array.isArray(webCourses) || webCourses.length === 0) {
      return res.status(400).json({ ok: false, error: "Expected export const COURSES = [...]" });
    }

    let inserted = 0;
    let updated = 0;

    for (const c of webCourses) {
      const title = String(c.title || c.name || "").trim();
      if (!title) continue;

      const subject = String(c.subject || c.category || c.area || c.track || "General").trim() || "General";
      const description = String(c.summary || c.description || "").trim() || "No description";
      const level = String(c.level || c.difficulty || "beginner").trim().toLowerCase() || "beginner";
      const language = String(c.language || "en").trim().toLowerCase() || "en";
      const is_free = Boolean(c.is_free ?? c.free ?? false);

      const stableKey = `${title}::${subject}`;
      const id = crypto
        .createHash("sha1")
        .update(stableKey)
        .digest("hex")
        .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*$/, "$1-$2-$3-$4-$5");

      const r = await pool.query(
        `INSERT INTO courses (id, title, subject, level, language, description, is_free, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'import')
         ON CONFLICT (id) DO UPDATE SET
           title=EXCLUDED.title,
           subject=EXCLUDED.subject,
           level=EXCLUDED.level,
           language=EXCLUDED.language,
           description=EXCLUDED.description,
           is_free=EXCLUDED.is_free,
           source='import'
         RETURNING (xmax = 0) AS inserted;`,
        [id, title, subject, level, language, description, is_free]
      );

      if (r.rows?.[0]?.inserted) inserted++;
      else updated++;
    }

    const count = await pool.query(`SELECT COUNT(*)::int AS n FROM courses;`);
    res.json({ ok: true, inserted, updated, total: count.rows[0].n });
  } catch (e) {
    console.error("POST /admin/import-web-courses error:", e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.use((req, res) => res.status(404).json({ ok: false, error: "Not found" }));

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`API listening on ${port}`));
