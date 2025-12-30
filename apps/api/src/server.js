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

app.use((req, res) => res.status(404).json({ ok: false, error: "Not found" }));

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("API listening on", port));
