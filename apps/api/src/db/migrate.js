import "dotenv/config";
import { pool } from "./pool.js";

async function run() {
  await pool.query("create extension if not exists pgcrypto;");

  await pool.query(`
    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      email text unique not null,
      password_hash text not null,
      role text not null default 'learner',
      email_verified boolean not null default false,
      created_at timestamptz not null default now()
    );

    create table if not exists email_verifications (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references users(id) on delete cascade,
      token text unique not null,
      expires_at timestamptz not null,
      used_at timestamptz,
      created_at timestamptz not null default now()
    );

    create table if not exists password_resets (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references users(id) on delete cascade,
      token text unique not null,
      expires_at timestamptz not null,
      used_at timestamptz,
      created_at timestamptz not null default now()
    );

    create table if not exists courses (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      level text not null,
      language text not null default 'en',
      description text not null,
      is_free boolean not null default true,
      created_at timestamptz not null default now()
    );

    create table if not exists progress (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references users(id) on delete cascade,
      course_id uuid references courses(id) on delete cascade,
      percent int not null default 0,
      updated_at timestamptz not null default now(),
      unique(user_id, course_id)
    );

    create table if not exists certificates (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references users(id) on delete cascade,
      course_id uuid references courses(id) on delete cascade,
      public_id text unique not null,
      issued_at timestamptz not null default now()
    );

    create table if not exists certificate_credits (
      user_id uuid primary key references users(id) on delete cascade,
      credits int not null default 0,
      updated_at timestamptz not null default now()
    );


    create table if not exists referrals (
      code text primary key,
      owner_user_id uuid references users(id) on delete cascade,
      created_at timestamptz not null default now()
    );


    create table if not exists sponsorships (
      id uuid primary key default gen_random_uuid(),
      sponsor_user_id uuid references users(id) on delete set null,
      sponsor_email text,
      kind text not null, -- pool | certificate | cohort
      cohort_size int,
      amount_cents int not null,
      currency text not null default 'gbp',
      stripe_session_id text unique,
      status text not null default 'pending', -- pending | paid | failed
      created_at timestamptz not null default now()
    );


create table if not exists user_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  country text,
  preferred_language text default 'en',
  accessibility_needs text[] default '{}',
  economic_barrier boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sponsorship_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  desired_course_id uuid references courses(id) on delete set null,
  note text,
  status text not null default 'pending', -- pending | allocated | closed
  created_at timestamptz not null default now()
);

    create table if not exists sponsorship_allocations (
      id uuid primary key default gen_random_uuid(),
      sponsorship_id uuid references sponsorships(id) on delete cascade,
      recipient_user_id uuid references users(id) on delete cascade,
      course_id uuid references courses(id) on delete set null,
      note text,
      created_at timestamptz not null default now()
    );

    create table if not exists legacy_intents (
      id uuid primary key default gen_random_uuid(),
      name text,
      email text,
      country text,
      pledge_type text not null default 'general', -- general | fixed_sum | percentage | residue | assets
      note text,
      consent boolean not null default false,
      status text not null default 'new', -- new | contacted | closed
      created_at timestamptz not null default now()
    );
    
    create table if not exists receipt_counters (
      year int primary key,
      last_number int not null default 0,
      updated_at timestamptz not null default now()
    );

    create table if not exists legacy_gifts (
      id uuid primary key default gen_random_uuid(),
      intent_id uuid references legacy_intents(id) on delete set null,
      received_from text, -- executor/solicitor name or reference
      amount_cents int not null,
      currency text not null default 'gbp',
      method text not null default 'bank', -- bank | card | crypto | other
      reference text,
      verified boolean not null default false,
      verified_by uuid references users(id) on delete set null,
      verified_at timestamptz,
      received_at timestamptz not null default now(),
      note text
    );

    alter table legacy_gifts
      add column if not exists receipt_number text,
      add column if not exists receipt_hash text;

    create table if not exists referral_events (
      id uuid primary key default gen_random_uuid(),
      code text references referrals(code) on delete set null,
      referred_user_id uuid references users(id) on delete cascade,
      created_at timestamptz not null default now()
    );
  `);

  const { rows } = await pool.query("select count(*)::int as c from courses");
  if (rows[0].c === 0) {
    await pool.query(`
      insert into courses (title, level, language, description, is_free) values
      ('Algebra Foundations', 'beginner', 'en', '10-minute calm lessons. SEN-friendly pacing.', true),
      ('Digital Literacy', 'beginner', 'en', 'Email, safety, and everyday tech confidence.', true),
      ('Customer Support Internship Track', 'intermediate', 'en', 'Work-ready skills with simulations.', false),
      ('AI Fundamentals', 'intermediate', 'en', 'Practical AI literacy for modern careers.', false);
    `);
  }

  console.log("DB migration complete (v3).");
  await pool.end();
}
run().catch((e)=>{ console.error(e); process.exit(1); });
