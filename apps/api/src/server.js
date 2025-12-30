import cors from "cors";
import express from "express";
import { pool } from "./db/pool.js";
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Health check
 */
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/**
 * Get courses (supports pagination)
 *   /courses?limit=100&offset=0
 */
app.get("/courses", async (req, res) => {
  try {
    const limitRaw = Number(req.query.limit ?? 200);
    const offsetRaw = Number(req.query.offset ?? 0);

    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 5000) : 200;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    const result = await pool.query(
      `SELECT id, title, level, language, description, is_free, created_at
       FROM courses
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2;`,
      [limit, offset]
    );

    res.json({ ok: true, courses: result.rows, limit, offset });
  } catch (err) {
    console.error("GET /courses error:", err);
    res.status(500).json({ ok: false, error: "db_error" });
  }
});

/**
 * Seed courses into DB
 *   POST /seed-courses?n=1000
 *
 * This version does NOT depend on Postgres extensions (pgcrypto/uuid-ossp).
 * It generates UUIDs in Node (crypto.randomUUID()) so it will work on Render.
 */
app.post("/seed-courses", async (req, res) => {
  try {
    const nRaw = Number(req.query.n ?? 1000);
    const n = Number.isFinite(nRaw) ? Math.min(Math.max(nRaw, 1), 5000) : 1000;

    // Ensure table exists (no extension required)
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

    // Bulk insert n rows
    const values = [];
    const params = [];
    let p = 1;

    for (let i = 1; i <= n; i++) {
      const id = crypto.randomUUID();
      const title = `Course ${i}`;
      const level = i % 3 === 0 ? "beginner" : i % 3 === 1 ? "intermediate" : "advanced";
      const language = "en";
      const description = `Auto-seeded course number ${i}.`;
      const is_free = i % 2 === 0;

      values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
      params.push(id, title, level, language, description, is_free);
    }

    await pool.query(
      `INSERT INTO courses (id, title, level, language, description, is_free)
       VALUES ${values.join(", ")}
       ON CONFLICT (id) DO NOTHING;`,
      params
    );

    const count = await pool.query("SELECT COUNT(*)::int AS n FROM courses;");
    res.json({ ok: true, seeded: n, total: count.rows[0].n });
  } catch (err) {
    console.error("POST /seed-courses error:", err);
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

/**
 * Fallback 404
 */
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`API listening on ${port}`);
});
