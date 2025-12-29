"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, getToken } from "../../../lib/api";

export default function Admin() {
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ title:"", level:"beginner", language:"en", description:"", is_free:true });

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        if (!token) { setMsg("âŒ Please login first."); return; }
        const d = await apiGet("/user/me", token);
        if (d.user.role !== "admin") setMsg("âŒ Admin only. (Create an admin user by registering via API with role=admin.)");
      } catch (e:any) {
        setMsg("âŒ " + (e?.message || "error"));
      }
    })();
  }, []);

  async function createCourse() {
    setMsg("");
    try {
      const token = getToken();
      if (!token) { setMsg("âŒ Please login first."); return; }
      const c = await apiPost("/admin/courses", form, token);
      setMsg("âœ… Course created: " + c.course.title);
      setForm({ title:"", level:"beginner", language:"en", description:"", is_free:true });
    } catch (e:any) { setMsg("âŒ " + (e?.message || "error")); }
  }

  return (
    <div className="card">
      <div className="h1">Admin â€” Course Builder</div>
      <div className="muted">Create courses safely (no copyrighted material).</div>
      <hr />
      {msg && <div className="muted" style={{ whiteSpace:"pre-wrap"  }}>{msg}</div>}
      <label>Title</label>
      <input value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} />
      <label>Level (beginner/intermediate/advanced/professional)</label>
      <input value={form.level} onChange={(e)=>setForm({...form, level:e.target.value})} />
      <label>Language (ISO code e.g. en, fr, ar)</label>
      <input value={form.language} onChange={(e)=>setForm({...form, language:e.target.value})} />
      <label>Description</label>
      <input value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />
      <label>Free? (true/false)</label>
      <input value={String(form.is_free)} onChange={(e)=>setForm({...form, is_free:e.target.value === "true"})} />
      <div className="row" style={{ marginTop:12  }}>
        <button className="btn primary" onClick={createCourse}>Create Course</button>
      </div>
    </div>
  );
}

