import 

// Admin: verify receipt hash (tamper-evident)
app.get("/admin/legacy/gifts/verify/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = req.params.id;
  const { rows } = await pool.query(
    "select id, amount_cents, currency, method, reference, received_from, received_at, receipt_number, receipt_hash, verified from legacy_gifts where id=$1",
    [id]
  );
  const g = rows[0];
  if (!g) return res.status(404).json({ error: "gift_not_found" });

  const payload = {
    receiptNumber: g.receipt_number,
    amountCents: g.amount_cents,
    currency: g.currency,
    method: g.method,
    reference: g.reference ?? null,
    receivedFrom: g.received_from ?? null,
    receivedAt: new Date(g.received_at).toISOString(),
  };
  const recomputed = computeReceiptHash(payload);
  res.json({ ok: true, verified: g.verified, receipt_number: g.receipt_number, stored_hash: g.receipt_hash, recomputed_hash: recomputed, matches: (g.receipt_hash === recomputed) });
});

"dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { z } from "zod";
import Stripe from "stripe";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import { pool } from "./db/pool.js";
import { signToken, requireAuth } from "./lib/auth.js";

const app = express();
app.use((req,res,next)=>{
  if (req.originalUrl === "/webhooks/stripe") return next();
  return express.json({ limit: "1mb" })(req,res,next);
});
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "*", credentials: true }));

app.get("/health", (req, res) => res.json({ ok: true, version: "v3" }));

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(401).json({ error: "missing_token" });
    if (req.user.role !== role) return res.status(403).json({ error: "forbidden" });
    next();
  };
}

function token32() {
  return crypto.randomBytes(24).toString("hex");
}
function expiresInMinutes(min) {
  return new Date(Date.now() + min * 60 * 1000);
}
async function ensureReferralForUser(userId) {
  // create a stable code if missing
  const { rows: existing } = await pool.query("select code from referrals where owner_user_id=$1 limit 1", [userId]);
  if (existing[0]) return existing[0].code;

  for (let i = 0; i < 5; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    try {
      await pool.query("insert into referrals (code, owner_user_id) values ($1,$2)", [code, userId]);
      return code;
    } catch {}
  }
  // fallback (rare)
  const fallback = "RTL" + crypto.randomBytes(3).toString("hex").toUpperCase();
  await pool.query("insert into referrals (code, owner_user_id) values ($1,$2) on conflict do nothing", [fallback, userId]);
  return fallback;
}




async function addCertificateCredit(userId, n = 1) {
  await pool.query(
    `insert into certificate_credits (user_id, credits)
     values ($1, $2)
     on conflict (user_id) do update set
       credits = certificate_credits.credits + excluded.credits,
       updated_at = now()`,
    [userId, n]
  );
}

// --- Fairness "AI-assisted" allocator (rule-based scoring, privacy-safe) ---
// Score prioritizes: accessibility needs, economic barrier, then oldest application.
async function autoAllocateSponsorship(sponsorshipId) {
  const { rows: srows } = await pool.query(
    "select id, kind, cohort_size, amount_cents, currency, status from sponsorships where id=$1",
    [sponsorshipId]
  );
  const s = srows[0];
  if (!s || s.status !== "paid") return;

  // Determine how many allocations to make
  let seats = 1;
  if (s.kind === "cohort") seats = Math.max(1, Number(s.cohort_size || 20));
  if (s.kind === "pool") {
    // approximate "seat cost" at 9.99 (in cents) for allocation units
    const perSeat = 999;
    seats = Math.max(1, Math.floor(Number(s.amount_cents || 0) / perSeat));
  }

  const { rows: apps } = await pool.query(
    `select a.id as app_id, a.user_id, a.desired_course_id, a.created_at,
            coalesce(array_length(p.accessibility_needs,1),0) as access_count,
            coalesce(p.economic_barrier,false) as economic_barrier
     from sponsorship_applications a
     left join user_profiles p on p.user_id=a.user_id
     where a.status='pending'
     order by
       coalesce(array_length(p.accessibility_needs,1),0) desc,
       coalesce(p.economic_barrier,false) desc,
       a.created_at asc
     limit $1`,
    [seats]
  );

  for (const a of apps) {
    await pool.query(
      "insert into sponsorship_allocations (sponsorship_id, recipient_user_id, course_id, note) values ($1,$2,$3,$4)",
      [s.id, a.user_id, a.desired_course_id ?? null, "Auto-allocated (fairness matching)"]
    );
    await pool.query("update sponsorship_applications set status='allocated' where id=$1", [a.app_id]);
  }
}

// --- META: languages (starter list; extend anytime) ---
app.get("/meta/languages", (req, res) => {
  const languages = [
    { code: "en", name: "English" }, { code: "es", name: "Spanish" }, { code: "fr", name: "French" },
    { code: "de", name: "German" }, { code: "pt", name: "Portuguese" }, { code: "it", name: "Italian" },
    { code: "nl", name: "Dutch" }, { code: "sv", name: "Swedish" }, { code: "no", name: "Norwegian" },
    { code: "da", name: "Danish" }, { code: "fi", name: "Finnish" }, { code: "pl", name: "Polish" },
    { code: "cs", name: "Czech" }, { code: "ro", name: "Romanian" }, { code: "hu", name: "Hungarian" },
    { code: "el", name: "Greek" }, { code: "tr", name: "Turkish" }, { code: "ru", name: "Russian" },
    { code: "uk", name: "Ukrainian" }, { code: "ar", name: "Arabic" }, { code: "he", name: "Hebrew" },
    { code: "hi", name: "Hindi" }, { code: "bn", name: "Bengali" }, { code: "ur", name: "Urdu" },
    { code: "ta", name: "Tamil" }, { code: "te", name: "Telugu" }, { code: "id", name: "Indonesian" },
    { code: "ms", name: "Malay" }, { code: "vi", name: "Vietnamese" }, { code: "th", name: "Thai" },
    { code: "zh", name: "Chinese" }, { code: "ja", name: "Japanese" }, { code: "ko", name: "Korean" },
    { code: "sw", name: "Swahili" }, { code: "yo", name: "Yoruba" }, { code: "ig", name: "Igbo" },
    { code: "ha", name: "Hausa" }, { code: "zu", name: "Zulu" },
  ];
  res.json({ languages });
});

// --- Auth ---
const Register = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().optional(),
  referralCode: z.string().optional(),
});
app.post("/auth/register", async (req, res) => {
  const parsed = Register.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });

  const { email, password, referralCode } = parsed.data;
  const role = (parsed.data.role ?? "learner").toLowerCase();

  const hash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await pool.query(
      "insert into users (email, password_hash, role) values ($1,$2,$3) returning id,email,role,email_verified",
      [email.toLowerCase(), hash, role]
    );

    const user = rows[0];

    const vtoken = token32();
    await pool.query(
      "insert into email_verifications (user_id, token, expires_at) values ($1,$2,$3)",
      [user.id, vtoken, expiresInMinutes(60 * 24)]
    );

    if (referralCode) {
      const code = referralCode.toUpperCase();
      const { rows: refRows } = await pool.query("select code from referrals where code=$1", [code]);
      if (refRows[0]) {
        await pool.query("insert into referral_events (code, referred_user_id) values ($1,$2)", [code, user.id]);
      }
    }

    const myCode = await ensureReferralForUser(user.id);

    const token = signToken(user);
    console.log("Email verification link (dev):", `${process.env.PUBLIC_WEB_URL || "http://localhost:3000"}/portal/verify?token=${vtoken}`);

    return res.json({ token, user, emailVerificationToken: vtoken, referralCode: myCode });
  } catch (e) {
    if (String(e).includes("unique")) return res.status(409).json({ error: "email_in_use" });
    return res.status(500).json({ error: "server_error" });
  }
});

const Login = z.object({ email: z.string().email(), password: z.string().min(1) });
app.post("/auth/login", async (req, res) => {
  const parsed = Login.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const { email, password } = parsed.data;
  const { rows } = await pool.query("select id,email,role,email_verified,password_hash from users where email=$1", [email.toLowerCase()]);
  if (!rows[0]) return res.status(401).json({ error: "invalid_credentials" });

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const token = signToken(rows[0]);
  return res.json({ token, user: { id: rows[0].id, email: rows[0].email, role: rows[0].role, email_verified: rows[0].email_verified } });
});

app.get("/user/me", requireAuth, async (req, res) => {
  const { rows } = await pool.query("select id,email,role,email_verified,created_at from users where id=$1", [req.user.sub]);
  return res.json({ user: rows[0] });
});

// --- User profile (country, language, accessibility, economic barrier) ---
app.get("/user/profile", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    "select user_id, country, preferred_language, accessibility_needs, economic_barrier from user_profiles where user_id=$1",
    [req.user.sub]
  );
  res.json({ profile: rows[0] ?? { user_id: req.user.sub, country: null, preferred_language: "en", accessibility_needs: [], economic_barrier: false } });
});

app.post("/user/profile", requireAuth, async (req, res) => {
  const Body = z.object({
    country: z.string().max(80).optional().nullable(),
    preferred_language: z.string().max(10).optional(),
    accessibility_needs: z.array(z.string().max(40)).max(20).optional(),
    economic_barrier: z.boolean().optional(),
  });
  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });

  const p = parsed.data;
  await pool.query(
    `insert into user_profiles (user_id, country, preferred_language, accessibility_needs, economic_barrier)
     values ($1,$2,$3,$4,$5)
     on conflict (user_id) do update set
       country=excluded.country,
       preferred_language=excluded.preferred_language,
       accessibility_needs=excluded.accessibility_needs,
       economic_barrier=excluded.economic_barrier,
       updated_at=now()`,
    [
      req.user.sub,
      p.country ?? null,
      (p.preferred_language ?? "en").toLowerCase(),
      p.accessibility_needs ?? [],
      p.economic_barrier ?? false
    ]
  );
  res.json({ ok: true });
});

app.get("/user/certificate-credits", requireAuth, async (req, res) => {
  const { rows } = await pool.query("select credits from certificate_credits where user_id=$1", [req.user.sub]);
  res.json({ credits: rows[0]?.credits ?? 0 });
});




const Verify = z.object({ token: z.string().min(10) });
app.post("/auth/verify-email", async (req, res) => {
  const parsed = Verify.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const { rows } = await pool.query(
    "select id,user_id,expires_at,used_at from email_verifications where token=$1",
    [parsed.data.token]
  );
  if (!rows[0]) return res.status(404).json({ error: "invalid_token" });
  if (rows[0].used_at) return res.status(409).json({ error: "token_used" });
  if (new Date(rows[0].expires_at).getTime() < Date.now()) return res.status(410).json({ error: "token_expired" });

  await pool.query("update email_verifications set used_at=now() where id=$1", [rows[0].id]);
  await pool.query("update users set email_verified=true where id=$1", [rows[0].user_id]);
  return res.json({ ok: true });
});

const ResetRequest = z.object({ email: z.string().email() });
app.post("/auth/request-password-reset", async (req, res) => {
  const parsed = ResetRequest.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const { rows } = await pool.query("select id from users where email=$1", [parsed.data.email.toLowerCase()]);
  if (!rows[0]) return res.json({ ok: true });

  const token = token32();
  await pool.query("insert into password_resets (user_id, token, expires_at) values ($1,$2,$3)", [rows[0].id, token, expiresInMinutes(30)]);
  console.log("Password reset link (dev):", `${process.env.PUBLIC_WEB_URL || "http://localhost:3000"}/portal/reset/confirm?token=${token}`);

  return res.json({ ok: true, resetToken: token });
});

const ResetConfirm = z.object({ token: z.string().min(10), newPassword: z.string().min(8) });
app.post("/auth/reset-password", async (req, res) => {
  const parsed = ResetConfirm.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });

  const { rows } = await pool.query("select id,user_id,expires_at,used_at from password_resets where token=$1", [parsed.data.token]);
  if (!rows[0]) return res.status(404).json({ error: "invalid_token" });
  if (rows[0].used_at) return res.status(409).json({ error: "token_used" });
  if (new Date(rows[0].expires_at).getTime() < Date.now()) return res.status(410).json({ error: "token_expired" });

  const hash = await bcrypt.hash(parsed.data.newPassword, 10);
  await pool.query("update users set password_hash=$1 where id=$2", [hash, rows[0].user_id]);
  await pool.query("update password_resets set used_at=now() where id=$1", [rows[0].id]);

  return res.json({ ok: true });
});

// --- Courses ---
app.get("/courses", async (req, res) => {
  const lang = req.query.language ? String(req.query.language) : null;
  const level = req.query.level ? String(req.query.level) : null;

  const where = [];
  const vals = [];
  if (lang) { vals.push(lang); where.push(`language=$${vals.length}`); }
  if (level) { vals.push(level); where.push(`level=$${vals.length}`); }

  const sql = `select id,title,level,language,description,is_free from courses ${where.length ? "where "+where.join(" and ") : ""} order by created_at desc`;
  const { rows } = await pool.query(sql, vals);
  return res.json({ courses: rows });
});

// Admin course create
const CourseCreate = z.object({
  title: z.string().min(2),
  level: z.enum(["beginner","intermediate","advanced","professional"]).default("beginner"),
  language: z.string().min(2).default("en"),
  description: z.string().min(10),
  is_free: z.boolean().default(true),
});
app.post("/admin/courses", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = CourseCreate.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  const c = parsed.data;
  const { rows } = await pool.query(
    "insert into courses (title, level, language, description, is_free) values ($1,$2,$3,$4,$5) returning id,title,level,language,description,is_free",
    [c.title, c.level, c.language, c.description, c.is_free]
  );
  res.json({ course: rows[0] });
});

// --- Referrals ---
app.get("/referrals/me", requireAuth, async (req, res) => {
  const code = await ensureReferralForUser(req.user.sub);
  const { rows: stats } = await pool.query("select count(*)::int as referrals from referral_events where code=$1", [code]);
  res.json({ code, referrals: stats[0].referrals });
});

// --- Certificates ---
app.post("/certificates/issue", requireAuth, async (req, res) => {
  const Body = z.object({ courseId: z.string().uuid() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const courseId = parsed.data.courseId;
  const { rows: courseRows } = await pool.query("select title from courses where id=$1", [courseId]);
  if (!courseRows[0]) return res.status(404).json({ error: "course_not_found" });

  const publicId = crypto.randomBytes(10).toString("hex");
  const { rows } = await pool.query(
    "insert into certificates (user_id, course_id, public_id) values ($1,$2,$3) returning public_id, issued_at",
    [req.user.sub, courseId, publicId]
  );
  res.json({ certificate: rows[0] });
});

// Issue a certificate using a sponsored credit (earned via Compassionate Give)
app.post("/certificates/issue-from-credit", requireAuth, async (req, res) => {
  const Body = z.object({ courseId: z.string().uuid() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const { rows: cr } = await pool.query("select credits from certificate_credits where user_id=$1", [req.user.sub]);
  const credits = cr[0]?.credits ?? 0;
  if (credits <= 0) return res.status(409).json({ error: "no_certificate_credits" });

  const courseId = parsed.data.courseId;
  const { rows: courseRows } = await pool.query("select title from courses where id=$1", [courseId]);
  if (!courseRows[0]) return res.status(404).json({ error: "course_not_found" });

  // consume credit first (atomic)
  const { rowCount } = await pool.query(
    "update certificate_credits set credits = credits - 1, updated_at=now() where user_id=$1 and credits > 0",
    [req.user.sub]
  );
  if (rowCount === 0) return res.status(409).json({ error: "no_certificate_credits" });

  const publicId = crypto.randomBytes(10).toString("hex");
  const { rows } = await pool.query(
    "insert into certificates (user_id, course_id, public_id) values ($1,$2,$3) returning public_id, issued_at",
    [req.user.sub, courseId, publicId]
  );
  res.json({ certificate: rows[0] });
});



app.get("/certificates/mine", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `select c.public_id, c.issued_at, crs.title, crs.level, crs.language
     from certificates c join courses crs on crs.id=c.course_id
     where c.user_id=$1 order by c.issued_at desc`,
    [req.user.sub]
  );
  res.json({ certificates: rows });
});

app.get("/certificates/verify/:publicId", async (req, res) => {
  const id = req.params.publicId;
  const { rows } = await pool.query(
    `select c.public_id, c.issued_at, u.email, crs.title, crs.level, crs.language
     from certificates c join users u on u.id=c.user_id join courses crs on crs.id=c.course_id
     where c.public_id=$1`,
    [id]
  );
  if (!rows[0]) return res.status(404).json({ error: "not_found" });
  res.json({ certificate: rows[0] });
});

app.get("/certificates/pdf/:publicId", async (req, res) => {
  const id = req.params.publicId;
  const { rows } = await pool.query(
    `select c.public_id, c.issued_at, u.email, crs.title, crs.level, crs.language
     from certificates c join users u on u.id=c.user_id join courses crs on crs.id=c.course_id
     where c.public_id=$1`,
    [id]
  );
  if (!rows[0]) return res.status(404).json({ error: "not_found" });

  const cert = rows[0];
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="readytolearn-certificate-${cert.public_id}.pdf"`);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  doc.fontSize(26).text("Certificate of Achievement", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(14).text("Readytolearn", { align: "center" });
  doc.moveDown(1.5);

  doc.fontSize(12).text("This certifies that:", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(18).text(cert.email, { align: "center" });
  doc.moveDown(1);

  doc.fontSize(12).text("has successfully completed:", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(18).text(cert.title, { align: "center" });
  doc.moveDown(1);

  doc.fontSize(11).text(`Level: ${cert.level}   ·   Language: ${cert.language}`, { align: "center" });
  doc.moveDown(0.8);
  doc.fontSize(11).text(`Issued: ${new Date(cert.issued_at).toISOString().slice(0,10)}`, { align: "center" });
  doc.moveDown(1.2);

  doc.fontSize(10).text(`Verify: ${(process.env.PUBLIC_WEB_URL || "http://localhost:3000")}/portal/certificates/verify/${cert.public_id}`, { align: "center" });

  doc.end();
});


// --- Compassionate Give (Sponsorships) ---
app.get("/sponsorships/stats", async (req, res) => {
  const { rows: total } = await pool.query(
    "select coalesce(sum(amount_cents),0)::int as amount_cents, count(*)::int as count from sponsorships where status='paid'"
  );
  const { rows: alloc } = await pool.query(
    "select count(*)::int as allocations, count(distinct recipient_user_id)::int as learners from sponsorship_allocations"
  );
  const { rows: pending } = await pool.query(
    "select coalesce(sum(amount_cents),0)::int as amount_cents from sponsorships where status='pending'"
  );
  res.json({
    totals: {
      paid_amount_cents: total[0].amount_cents,
      sponsorships: total[0].count,
      allocated_records: alloc[0].allocations,
      unique_learners_supported: alloc[0].learners,
      pending_amount_cents: pending[0].amount_cents
    }
  });
});

app.get("/sponsorships/breakdown", async (req, res) => {
  // Breakdown based on allocations (privacy-safe)
  const { rows: countries } = await pool.query(
    `select coalesce(p.country,'Unknown') as label, count(*)::int as count
     from sponsorship_allocations sa
     left join user_profiles p on p.user_id=sa.recipient_user_id
     group by label order by count desc limit 12`
  );
  const { rows: languages } = await pool.query(
    `select coalesce(p.preferred_language,'en') as label, count(*)::int as count
     from sponsorship_allocations sa
     left join user_profiles p on p.user_id=sa.recipient_user_id
     group by label order by count desc limit 12`
  );
  const { rows: access } = await pool.query(
    `select coalesce(need,'None') as label, count(*)::int as count
     from (
       select unnest(coalesce(p.accessibility_needs,'{}'::text[])) as need
       from sponsorship_allocations sa
       left join user_profiles p on p.user_id=sa.recipient_user_id
     ) t
     group by label order by count desc limit 12`
  );

  res.json({ countries, languages, accessibility: access });
});

// --- Legacy Giving (Wills & Estates) ---
app.get("/legacy/stats", async (req, res) => {
  const { rows: totals } = await pool.query(
    "select coalesce(sum(amount_cents),0)::int as amount_cents, count(*)::int as gifts from legacy_gifts where verified=true"
  );
  const { rows: intents } = await pool.query(
    "select count(*)::int as intents from legacy_intents"
  );
  res.json({ totals: { verified_amount_cents: totals[0].amount_cents, verified_gifts: totals[0].gifts, intents: intents[0].intents } });
});

// Public: verify a receipt number + hash without exposing personal data
// Returns minimal information: valid/invalid + amount/currency/date if verified
app.get("/legacy/receipts/verify", async (req, res) => {
  const receiptNumber = (req.query.receiptNumber || "").toString().trim();
  const receiptHash = (req.query.receiptHash || "").toString().trim();
  if (!receiptNumber || !receiptHash) return res.status(400).json({ error: "missing_params" });

  const { rows } = await pool.query(
    `select receipt_number, receipt_hash, verified, amount_cents, currency, received_at
     from legacy_gifts
     where receipt_number=$1
     limit 1`,
    [receiptNumber]
  );
  const g = rows[0];
  if (!g) return res.json({ ok: true, valid: false });

  // Constant-time compare would be better; still fine for this non-sensitive check.
  const matches = (g.receipt_hash === receiptHash);
  if (!matches) return res.json({ ok: true, valid: false });

  // Only reveal minimal details if verified
  if (!g.verified) return res.json({ ok: true, valid: true, verified: false });

  res.json({
    ok: true,
    valid: true,
    verified: true,
    receiptNumber: g.receipt_number,
    amountCents: g.amount_cents,
    currency: g.currency,
    receivedAt: new Date(g.received_at).toISOString(),
  });
});



// Public: non-binding intent form (no legal advice, informational only)
app.post("/legacy/intent", async (req, res) => {
  const Body = z.object({
    name: z.string().max(120).optional(),
    email: z.string().email().optional(),
    country: z.string().max(80).optional(),
    pledgeType: z.enum(["general","fixed_sum","percentage","residue","assets"]).default("general"),
    note: z.string().max(500).optional(),
    consent: z.boolean().default(false),
  });
  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  if (!parsed.data.consent) return res.status(400).json({ error: "consent_required" });

  const d = parsed.data;
  const { rows } = await pool.query(
    `insert into legacy_intents (name,email,country,pledge_type,note,consent)
     values ($1,$2,$3,$4,$5,$6) returning id, created_at, status`,
    [d.name ?? null, d.email ?? null, d.country ?? null, d.pledgeType, d.note ?? null, d.consent]
  );
  res.json({ intent: rows[0] });
});

// Admin: review intents
app.get("/admin/legacy/intents", requireAuth, requireRole("admin"), async (req, res) => {
  const { rows } = await pool.query(
    `select id, name, email, country, pledge_type, note, status, created_at
     from legacy_intents
     order by created_at desc
     limit 300`
  );
  res.json({ intents: rows });
});

// Admin: update intent status
app.post("/admin/legacy/intents/status", requireAuth, requireRole("admin"), async (req, res) => {
  const Body = z.object({ id: z.string().uuid(), status: z.enum(["new","contacted","closed"]) });
  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  await pool.query("update legacy_intents set status=$1 where id=$2", [parsed.data.status, parsed.data.id]);
  res.json({ ok: true });
});

// Admin: record/verify a received legacy gift (executor/solicitor transfer)
app.post("/admin/legacy/gifts/record", requireAuth, requireRole("admin"), async (req, res) => {
  const Body = z.object({
    intentId: z.string().uuid().optional(),
    receivedFrom: z.string().max(200).optional(),
    amountCents: z.number().int().min(1),
    currency: z.enum(["gbp","usd","eur"]).default("gbp"),
    method: z.enum(["bank","card","crypto","other"]).default("bank"),
    reference: z.string().max(120).optional(),
    note: z.string().max(500).optional(),
    verified: z.boolean().default(true),
  });
  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });

  const d = parsed.data;

const receiptNumber = d.verified ? await nextReceiptNumber() : null;
const receiptPayload = d.verified ? {
  receiptNumber,
  amountCents: d.amountCents,
  currency: d.currency,
  method: d.method,
  reference: d.reference ?? null,
  receivedFrom: d.receivedFrom ?? null,
  receivedAt: new Date().toISOString(),
} : null;
const receiptHash = d.verified ? computeReceiptHash(receiptPayload) : null;

  const { rows } = await pool.query(
    `insert into legacy_gifts (intent_id, received_from, amount_cents, currency, method, reference, note, verified, verified_by, verified_at, receipt_number, receipt_hash)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9, case when $8 then now() else null end, $10, $11)
         returning id, received_at, verified, receipt_number, receipt_hash`,
    [d.intentId ?? null, d.receivedFrom ?? null, d.amountCents, d.currency, d.method, d.reference ?? null, d.note ?? null, d.verified, req.user.sub, receiptNumber, receiptHash]
  );
  res.json({ gift: rows[0] });
});

app.get("/admin/legacy/gifts", requireAuth, requireRole("admin"), async (req, res) => {
  const { rows } = await pool.query(
    `select g.id, g.intent_id, g.received_from, g.amount_cents, g.currency, g.method, g.reference, g.verified, g.received_at, g.note
     from legacy_gifts g
     order by g.received_at desc
     limit 300`
  );
  res.json({ gifts: rows });
});

// Admin: download a receipt PDF for a verified legacy gift
app.get("/admin/legacy/gifts/receipt/:id.pdf", requireAuth, requireRole("admin"), async (req, res) => {
  const id = req.params.id;
  const { rows } = await pool.query(
    `select g.id, g.received_from, g.amount_cents, g.currency, g.method, g.reference, g.verified, g.received_at, g.receipt_number, g.receipt_hash,
            i.name as intent_name, i.email as intent_email, i.country as intent_country, i.pledge_type
     from legacy_gifts g
     left join legacy_intents i on i.id=g.intent_id
     where g.id=$1`,
    [id]
  );
  const g = rows[0];
  if (!g) return res.status(404).json({ error: "gift_not_found" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="readytolearn-legacy-receipt-${id}.pdf"`);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  doc.fontSize(18).text("Readytolearn — Legacy Gift Receipt", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#666").text("Informational receipt for executor/solicitor records. Not legal or tax advice.");
  doc.fillColor("#000");
  doc.moveDown();

  const amount = (Number(g.amount_cents || 0) / 100).toFixed(2);
  doc.fontSize(12).text(`Receipt number: ${g.receipt_number || '—'}`);
      doc.text(`Gift ID: ${g.id}`);
      if (g.receipt_hash) doc.text(`Receipt hash (SHA-256): ${g.receipt_hash}`);
  doc.text(`Date received: ${new Date(g.received_at).toISOString()}`);
  doc.text(`Verified: ${g.verified ? "Yes" : "No"}`);
  doc.moveDown();

  doc.fontSize(14).text("Gift details");
  doc.fontSize(12);
  doc.text(`Amount: ${g.currency?.toUpperCase()} ${amount}`);
  doc.text(`Method: ${g.method}`);
  if (g.reference) doc.text(`Reference: ${g.reference}`);
  if (g.received_from) doc.text(`Received from: ${g.received_from}`);
  doc.moveDown();

  doc.fontSize(14).text("Donor / intent (if provided)");
  doc.fontSize(12);
  doc.text(`Name: ${g.intent_name || "Not provided"}`);
  doc.text(`Email: ${g.intent_email || "Not provided"}`);
  doc.text(`Country: ${g.intent_country || "Not provided"}`);
  doc.text(`Pledge type: ${g.pledge_type || "Not provided"}`);
  doc.moveDown();

  doc.fontSize(14).text("Use of funds");
  doc.fontSize(12).text("Legacy gifts support learning access on Readytolearn, including Compassionate Give sponsorships, accessibility, and inclusive learning programs.");
  doc.moveDown();

  doc.fontSize(10).fillColor("#666").text("Readytolearn does not draft wills, provide legal/tax advice, act as executor, or manage estates. Please consult a qualified professional for estate matters.");
  doc.end();
});

// Admin: export legacy gifts as CSV for a given year
app.get("/admin/legacy/export.csv", requireAuth, requireRole("admin"), async (req, res) => {
  const year = Number(req.query.year || new Date().getUTCFullYear());
  const start = `${year}-01-01T00:00:00.000Z`;
  const end = `${year + 1}-01-01T00:00:00.000Z`;

  const { rows } = await pool.query(
    `select id, intent_id, received_from, amount_cents, currency, method, reference, verified, received_at
     from legacy_gifts
     where received_at >= $1 and received_at < $2
     order by received_at asc`,
    [start, end]
  );

  const header = ["id","intent_id","received_from","amount_cents","currency","method","reference","verified","received_at"];
  const escape = (v) => {
    const s = (v ?? "").toString().replace(/"/g,'""');
    return `"${s}"`;
  };
  const lines = [header.join(",")].concat(rows.map(r => header.map(k => escape(r[k])).join(",")));

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="readytolearn-legacy-${year}.csv"`);
  res.send(lines.join("\n"));
});

// Admin: year impact report PDF (summary)
app.get("/admin/legacy/report/:year.pdf", requireAuth, requireRole("admin"), async (req, res) => {
  const year = Number(req.params.year);
  if (!year || year < 1900 || year > 3000) return res.status(400).json({ error: "invalid_year" });

  const start = `${year}-01-01T00:00:00.000Z`;
  const end = `${year + 1}-01-01T00:00:00.000Z`;

  const { rows: totals } = await pool.query(
    `select coalesce(sum(amount_cents),0)::int as amount_cents,
            count(*)::int as gifts,
            count(*) filter (where verified=true)::int as verified_gifts,
            coalesce(sum(amount_cents) filter (where verified=true),0)::int as verified_amount_cents
     from legacy_gifts
     where received_at >= $1 and received_at < $2`,
    [start, end]
  );

  const { rows: methods } = await pool.query(
    `select method as label, count(*)::int as count
     from legacy_gifts
     where received_at >= $1 and received_at < $2 and verified=true
     group by method
     order by count desc`,
    [start, end]
  );

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="readytolearn-legacy-report-${year}.pdf"`);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  doc.fontSize(18).text(`Readytolearn — Legacy Giving Impact Report (${year})`);
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#666").text("Internal/admin report for transparency. Not legal or tax advice.");
  doc.fillColor("#000");
  doc.moveDown();

  const t = totals[0];
  const fmt = (cents) => `${(Number(cents||0)/100).toFixed(2)}`;
  doc.fontSize(12).text(`Total gifts recorded: ${t.gifts}`);
  doc.text(`Verified gifts: ${t.verified_gifts}`);
  doc.text(`Verified amount: ${fmt(t.verified_amount_cents)} (in mixed currencies; see CSV for detail)`);
  doc.moveDown();

  doc.fontSize(14).text("Verified gifts by method");
  doc.fontSize(12);
  if (methods.length === 0) doc.text("No verified gifts recorded for this year.");
  methods.forEach(m => doc.text(`• ${m.label}: ${m.count}`));
  doc.moveDown();

  doc.fontSize(14).text("Notes");
  doc.fontSize(12).text("Legacy funds support learning access on Readytolearn (Compassionate Give, accessibility and inclusive learning). Exact allocations can be tracked via sponsorship ledgers.");
  doc.moveDown();

  doc.fontSize(10).fillColor("#666").text("Readytolearn does not draft wills, provide legal/tax advice, act as executor, or manage estates. Estate matters should be handled by qualified professionals.");
  doc.end();
});









// Learner: apply for Compassionate Give support (adds to fairness pool)
app.post("/sponsorships/apply", requireAuth, async (req, res) => {
  const Body = z.object({
    desiredCourseId: z.string().uuid().optional(),
    note: z.string().max(300).optional(),
  });
  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });

  // Ensure profile exists (optional)
  await pool.query("insert into user_profiles (user_id) values ($1) on conflict do nothing", [req.user.sub]);

  const { rows } = await pool.query(
    "insert into sponsorship_applications (user_id, desired_course_id, note) values ($1,$2,$3) returning id, status, created_at",
    [req.user.sub, parsed.data.desiredCourseId ?? null, parsed.data.note ?? null]
  );
  res.json({ application: rows[0] });
});

// Admin: list pending applications (for audit / manual review)
app.get("/admin/sponsorships/applications", requireAuth, requireRole("admin"), async (req, res) => {
  const { rows } = await pool.query(
    `select a.id, a.status, a.created_at, u.email, p.country, p.preferred_language, p.accessibility_needs, p.economic_barrier, a.desired_course_id
     from sponsorship_applications a
     join users u on u.id=a.user_id
     left join user_profiles p on p.user_id=a.user_id
     where a.status='pending'
     order by a.created_at asc
     limit 200`
  );
  res.json({ applications: rows });
});

app.get("/admin/sponsorships/paid", requireAuth, requireRole("admin"), async (req, res) => {
  const { rows } = await pool.query(
    `select id, kind, cohort_size, amount_cents, currency, created_at
     from sponsorships where status='paid'
     order by created_at desc
     limit 200`
  );
  res.json({ sponsorships: rows });
});



// Create a sponsorship checkout session (no auth required; sponsor can be anonymous)
app.post("/sponsorships/create-session", async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: "stripe_not_configured" });
  const stripe = new Stripe(stripeKey);

  const Body = z.object({
    kind: z.enum(["pool","certificate","cohort"]).default("pool"),
    currency: z.enum(["gbp","usd","eur"]).default("gbp"),
    // for pool: custom amount in whole currency units (min 5)
    amount: z.number().min(5).max(100000).optional(),
    cohortSize: z.number().int().min(5).max(10000).optional(),
    sponsorEmail: z.string().email().optional(),
  });

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });

  const { kind, currency, amount, cohortSize, sponsorEmail } = parsed.data;

  // Pricing logic (simple defaults; can be tuned later)
  let unitAmountCents = 0;
  let name = "Compassionate Give";
  let qty = 1;

  if (kind === "certificate") {
    // sponsor a certificate purchase (fixed)
    unitAmountCents = currency === "gbp" ? 1999 : currency === "eur" ? 1999 : 1999;
    name = "Compassionate Give — Sponsor a Certificate";
  } else if (kind === "cohort") {
    // sponsor a cohort seat bundle (cohortSize required)
    const size = cohortSize ?? 20;
    // £9.99 per seat as a starter; fixed to keep it predictable
    const perSeat = currency === "gbp" ? 999 : currency === "eur" ? 999 : 999;
    unitAmountCents = perSeat;
    qty = size;
    name = `Compassionate Give — Sponsor a Cohort (${size} learners)`;
  } else {
    // pool: custom donation
    const a = amount ?? 25;
    unitAmountCents = Math.round(a * 100);
    name = "Compassionate Give — Learning Pool Donation";
  }

  // Pre-create a sponsorship record (pending)
  const { rows: srows } = await pool.query(
    "insert into sponsorships (sponsor_email, kind, cohort_size, amount_cents, currency, status) values ($1,$2,$3,$4,$5,'pending') returning id",
    [sponsorEmail ?? null, kind, cohortSize ?? null, unitAmountCents * qty, currency]
  );
  const sponsorshipId = srows[0].id;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency,
        product_data: { name },
        unit_amount: unitAmountCents,
      },
      quantity: qty
    }],
    success_url: process.env.STRIPE_SUCCESS_URL,
    cancel_url: process.env.STRIPE_CANCEL_URL,
    metadata: {
      item: "compassionate_give",
      kind,
      sponsorshipId,
      sponsorEmail: sponsorEmail ?? "",
    },
    customer_email: sponsorEmail,
  });

  await pool.query("update sponsorships set stripe_session_id=$1 where id=$2", [session.id, sponsorshipId]);
  res.json({ url: session.url });
});

// Webhook: mark sponsorship as paid
app.post("/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) return res.status(500).send("webhook_not_configured");

  let event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err?.message);
    return res.status(400).send(`Webhook Error`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session?.metadata?.item === "compassionate_give" && session?.metadata?.sponsorshipId) {
        await pool.query(
          "update sponsorships set status='paid' where id=$1",
          [session.metadata.sponsorshipId]
        );
      }
    }
  } catch (e) {
    console.error("Webhook handling failed:", e);
    return res.status(500).send("webhook_failed");
  }

  res.json({ received: true });
});

// Admin-only: allocate sponsorship to a learner/course (minimal ledger)
app.post("/admin/sponsorships/allocate", requireAuth, requireRole("admin"), async (req, res) => {
  const Body = z.object({
    sponsorshipId: z.string().uuid(),
    recipientUserId: z.string().uuid(),
    courseId: z.string().uuid().optional(),
    note: z.string().max(300).optional(),
  });
  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });

  const { rows: s } = await pool.query("select id,status from sponsorships where id=$1", [parsed.data.sponsorshipId]);
  if (!s[0]) return res.status(404).json({ error: "sponsorship_not_found" });
  if (s[0].status !== "paid") return res.status(409).json({ error: "sponsorship_not_paid" });

  const { rows } = await pool.query(
    "insert into sponsorship_allocations (sponsorship_id, recipient_user_id, course_id, note) values ($1,$2,$3,$4) returning id, created_at",
    [parsed.data.sponsorshipId, parsed.data.recipientUserId, parsed.data.courseId ?? null, parsed.data.note ?? null]
  );
  if (s[0].status === 'paid') {
        const { rows: sk } = await pool.query('select kind from sponsorships where id=$1', [parsed.data.sponsorshipId]);
        if (sk[0]?.kind === 'certificate') await addCertificateCredit(parsed.data.recipientUserId, 1);
      }
      res.json({ allocation: rows[0] });
});

// --- Stripe Payments ---
app.post("/payments/create-session", requireAuth, async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: "stripe_not_configured" });

  const stripe = new Stripe(stripeKey);
  const Body = z.object({ item: z.enum(["certificate","subscription"]).default("certificate") });
  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const item = parsed.data.item;
  const price = item === "subscription" ? 999 : 1999;
  const name = item === "subscription" ? "Readytolearn Pro (Monthly)" : "Certificate of Achievement";

  const session = await stripe.checkout.sessions.create({
    mode: item === "subscription" ? "subscription" : "payment",
    line_items: [{
      price_data: {
        currency: "gbp",
        product_data: { name },
        unit_amount: price,
        recurring: item === "subscription" ? { interval: "month" } : undefined,
      },
      quantity: 1
    }],
    success_url: process.env.STRIPE_SUCCESS_URL,
    cancel_url: process.env.STRIPE_CANCEL_URL,
    metadata: { userId: req.user.sub, item },
  });

  res.json({ url: session.url });
});

const port = Number(process.env.PORT ?? 5050);
app.listen(port, () => console.log(`Readytolearn API listening on :${port}`));


function computeReceiptHash(payload) {
  const secret = process.env.RECEIPT_HASH_SECRET || "change_me";
  const s = JSON.stringify(payload);
  return crypto.createHash("sha256").update(secret + ":" + s).digest("hex");
}

async function nextReceiptNumber() {
  const year = new Date().getUTCFullYear();
  await pool.query("insert into receipt_counters (year,last_number) values ($1,0) on conflict do nothing", [year]);
  const { rows } = await pool.query(
    "update receipt_counters set last_number = last_number + 1, updated_at=now() where year=$1 returning last_number",
    [year]
  );
  const n = rows[0].last_number;
  const padded = String(n).padStart(6, "0");
  return `LG-${year}-${padded}`;
}

