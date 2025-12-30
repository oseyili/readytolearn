import cors from "cors";
import express from "express";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import { pool } from "./db/pool.js";
import * as esbuild from "esbuild";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function mustBeAdmin(req, res) {
  const token = process.env.ADMIN_IMPORT_TOKEN;
  // If no token is set, we block in production to avoid accidental public import.
  if (!token && process.env.NODE_ENV === "production") {
    return res.status(403).json({ ok: false, error: "ADMIN_IMPORT_TOKEN not set" });
  }
  if (!token) return true; // local/dev ok

  const got = req.headers["x-admin-token"] || req.query.token;
  if (got !== token) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }
  return true;
}

async function ensureTables() {
  // Courses table (real course data)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id uuid PRIMARY KEY,
      title text NOT NULL,
      level text NOT NULL,
      language text NOT NULL,
      description text NOT NULL,
      is_free boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  // Enrollments table (real-time enroll)
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

app.get("/health", async (req, res) => {
  res.json({ ok: true });
});

app.get("/courses", async (req, res) => {
  try {
    await ensureTables();

    const limitRaw = Number(req.query.limit ?? 200);
    const offsetRaw = Number(req.query.offset ?? 0);

    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 5000) : 200;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    const r = await pool.query(
      `SELECT id, title, level, language, description, is_free, created_at
       FROM courses
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2;`,
      [limit, offset]
    );

    const count = await pool.query(`SELECT COUNT(*)::int AS n FROM courses;`);

    res.json({ ok: true, courses: r.rows, total: count.rows[0].n, limit, offset });
  } catch (e) {
    console.error("GET /courses error:", e);
    res.status(500).json({ ok: false, error: "db_error" });
  }
});

/**
 * REAL-TIME ENROLL
 * POST /enroll
 * body: { learnerId: string(uuid), courseId: string(uuid) }
 */
app.post("/enroll", async (req, res) => {
  try {
    await ensureTables();

    const learnerId = String(req.body?.learnerId || "");
    const courseId = String(req.body?.courseId || "");
    if (!learnerId || !courseId) {
      return res.status(400).json({ ok: false, error: "learnerId and courseId required" });
    }

    // validate course exists
    const check = await pool.query(`SELECT 1 FROM courses WHERE id=$1`, [courseId]);
    if (check.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "course_not_found" });
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO enrollments (id, learner_id, course_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (learner_id, course_id) DO NOTHING;`,
      [id, learnerId, courseId]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("POST /enroll error:", e);
    res.status(500).json({ ok: false, error: "db_error" });
  }
});

/**
 * LIST ENROLLMENTS (optional but useful)
 * GET /enrollments?learnerId=<uuid>
 */
app.get("/enrollments", async (req, res) => {
  try {
    await ensureTables();
    const learnerId = String(req.query.learnerId || "");
    if (!learnerId) return res.status(400).json({ ok: false, error: "learnerId required" });

    const r = await pool.query(
      `SELECT e.course_id, e.created_at, c.title, c.level, c.language, c.is_free
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

/**
 * IMPORT REAL COURSES FROM apps/web/app/courses/courses.data.ts
 * POST /admin/import-web-courses
 * Header: x-admin-token: <ADMIN_IMPORT_TOKEN>
 */
app.post("/admin/import-web-courses", async (req, res) => {
  const okAdmin = mustBeAdmin(req, res);
  if (okAdmin !== true) return;

  try {
    await ensureTables();

    const repoRoot = path.resolve(__dirname, "..", "..", ".."); // apps/api/src -> repo root
    const coursesTs = path.join(repoRoot, "apps", "web", "app", "courses", "courses.data.ts");

    // Read TS file
    const source = await fs.readFile(coursesTs, "utf8");

    // Transpile TS -> ESM JS in-memory
    const transformed = await esbuild.transform(source, {
      loader: "ts",
      format: "esm",
      target: "es2022",
      sourcemap: false,
    });

    // Import via data URL so Node can execute it
    const dataUrl = `data:text/javascript;base64,${Buffer.from(transformed.code).toString("base64")}`;
    const mod = await import(dataUrl);

    // We expect something like: export const courses = [...]
    const webCourses = mod.courses || mod.default || [];
    if (!Array.isArray(webCourses) || webCourses.length === 0) {
      return res.status(400).json({ ok: false, error: "Could not read exported courses array" });
    }

    // Insert/update into DB
    // We will generate a stable UUID from title+track if present, so reruns are safe.
    let inserted = 0;
    let updated = 0;

    for (const c of webCourses) {
      const title = String(c.title || c.name || "").trim();
      const description = String(c.summary || c.description || "").trim() || "No description";
      const level = String(c.level || c.difficulty || "beginner").trim().toLowerCase();
      const language = String(c.language || "en").trim().toLowerCase();
      const is_free = Boolean(c.is_free ?? c.free ?? false);

      if (!title) continue;

      const stableKey = `${title}::${String(c.track || "")}`;
      const id = crypto
        .createHash("sha1")
        .update(stableKey)
        .digest("hex")
        .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*$/, "$1-$2-$3-$4-$5");

      const r = await pool.query(
        `INSERT INTO courses (id, title, level, language, description, is_free)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           level = EXCLUDED.level,
           language = EXCLUDED.language,
           description = EXCLUDED.description,
           is_free = EXCLUDED.is_free
         RETURNING (xmax = 0) AS inserted;`,
        [id, title, level || "beginner", language || "en", description, is_free]
      );

      if (r.rows?.[0]?.inserted) inserted++;
      else updated++;
    }

    const count = await pool.query(`SELECT COUNT(*)::int AS n FROM courses;`);

    res.json({
      ok: true,
      imported_from: coursesTs,
      inserted,
      updated,
      total: count.rows[0].n,
    });
  } catch (e) {
    console.error("POST /admin/import-web-courses error:", e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`API listening on ${port}`));
