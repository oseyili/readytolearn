import cors from "cors";
import express from "express";
import { pool } from "./db/pool.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/courses", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM courses ORDER BY id ASC;");
    res.json({ ok: true, courses: r.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "db_error" });
  }
});

app.post("/seed-courses", async (req, res) => {
  try {
    const n = Number(req.query.n || 1000);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        level text NOT NULL,
        language text NOT NULL,
        description text NOT NULL,
        is_free boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const values = [];
    const params = [];
    let p = 1;

    for (let i = 1; i <= n; i++) {
      const title = `Course ${i}`;
      const level = i % 3 === 0 ? "beginner" : i % 3 === 1 ? "intermediate" : "advanced";
      const language = "en";
      const description = `Auto-seeded course number ${i}.`;
      const is_free = i % 2 === 0;

      values.push(`(gen_random_uuid(), ${p++}, ${p++}, ${p++}, ${p++}, ${p++})`);
      params.push(title, level, language, description, is_free);
    }

    await pool.query(
      `INSERT INTO courses (id, title, level, language, description, is_free) VALUES ${values.join(",")};`,
      params
    );

    const count = await pool.query("SELECT COUNT(*)::int AS n FROM courses;");
    res.json({ ok: true, seeded: n, total: count.rows[0].n });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.use((req, res) => res.status(404).json({ ok: false, error: "Not found" }));

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("API listening on", port));

