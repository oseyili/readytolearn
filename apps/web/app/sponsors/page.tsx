"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "../../lib/api";

function money(cents: number, currency: string) {
  const v = (cents ?? 0) / 100;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(v);
}

function BarList({ title, items }: { title: string; items: any[] }) {
  const max = Math.max(1, ...(items || []).map((i:any)=>Number(i.count||0)));
  return (
    <div className="card col-4" style={{background:"var(--surface2)"}}>
      <div className="h2">{title}</div>
      <div style={{marginTop:10}}>
        {(items || []).slice(0,10).map((i:any)=>(
          <div key={i.label} style={{marginBottom:10}}>
            <div className="row" style={{justifyContent:"space-between"}}>
              <div className="muted" style={{maxWidth:"70%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{i.label}</div>
              <div className="badge">{i.count}</div>
            </div>
            <div style={{height:10, background:"var(--surface)", borderRadius:999, overflow:"hidden", marginTop:6}}>
              <div style={{height:"100%", width:`${Math.round((Number(i.count)/max)*100)}%`, background:"var(--text)", opacity:0.18}} />
            </div>
          </div>
        ))}
        {(!items || items.length===0) && <div className="muted">No data yet.</div>}

<div className="card col-12">
  <div className="h2">Legacy totals</div>
  <div className="muted">Verified legacy gifts received through executor/solicitor transfers (privacy-safe totals).</div>
  <hr />
  {!legacy && <div className="muted">Legacy totals will appear after the API is running.</div>}
  {legacy && (
    <div className="grid">
      <div className="card col-4" style={{background:"var(--surface2)"}}>
        <div className="muted">Verified gifts</div>
        <div className="h2">{legacy.verified_gifts}</div>
      </div>
      <div className="card col-4" style={{background:"var(--surface2)"}}>
        <div className="muted">Verified amount</div>
        <div className="h2">{money(legacy.verified_amount_cents, currency)}</div>
      </div>
      <div className="card col-4" style={{background:"var(--surface2)"}}>
        <div className="muted">Intents recorded</div>
        <div className="h2">{legacy.intents}</div>
      </div>
    </div>
  )}
  <div className="row" style={{marginTop:12}}>
    <Link className="btn" href="/legacy-giving">Legacy Giving</Link>
          <Link className="btn" href="/verify-receipt">Verify receipt</Link>
    <Link className="btn" href="/legacy-intent">Record intent</Link>
  </div>
</div>
      </div>
    </div>
  );
}

export default function Sponsors() {
  const [stats, setStats] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [legacy, setLegacy] = useState<any>(null);
  const [currency, setCurrency] = useState<"gbp"|"usd"|"eur">("gbp");
  const [poolAmount, setPoolAmount] = useState<number>(25);
  const [cohortSize, setCohortSize] = useState<number>(20);
  const [sponsorEmail, setSponsorEmail] = useState<string>("");
  const [msg, setMsg] = useState<string>("");

  async function refresh() {
    try {
      const s = await apiGet("/sponsorships/stats");
      setStats(s.totals);
      const b = await apiGet("/sponsorships/breakdown");
      const l = await apiGet("/legacy/stats");
      setLegacy(l.totals);
      setBreakdown(b);
    } catch {}
  }

  useEffect(() => { refresh(); }, []);

  async function start(kind: "pool"|"certificate"|"cohort") {
    setMsg("");
    try {
      const body: any = { kind, currency, sponsorEmail: sponsorEmail || undefined };
      if (kind === "pool") body.amount = poolAmount;
      if (kind === "cohort") body.cohortSize = cohortSize;

      const r = await apiPost("/sponsorships/create-session", body);
      if (r?.url) window.location.href = r.url;
      else setMsg("❌ Could not start checkout.");
    } catch (e:any) {
      setMsg("❌ " + (e?.message || "error"));
    }
  }

  return (
    <div className="grid">
      <div className="card col-12">
        <div className="h1">Sponsors</div>
        <div className="muted">Support learning through Compassionate Give — dignified, transparent, measurable.</div>
        <hr />

        <div className="row">
          <label style={{minWidth:120}}>Currency</label>
          <select value={currency} onChange={(e)=>setCurrency(e.target.value as any)}>
            <option value="gbp">GBP</option>
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
          </select>
          <label style={{minWidth:160}}>Email (optional)</label>
          <input value={sponsorEmail} onChange={(e)=>setSponsorEmail(e.target.value)} placeholder="for receipt & updates" />
        </div>

        <div className="grid" style={{marginTop:12}}>
          <div className="card col-4" style={{background:"var(--surface2)"}}>
            <div className="h2">1) Sponsor a Certificate</div>
            <div className="muted">Fund a paid certificate for a learner.</div>
            <div className="row" style={{marginTop:12}}>
              <button className="btn primary" onClick={()=>start("certificate")}>Sponsor Certificate</button>
            </div>
          </div>

          <div className="card col-4" style={{background:"var(--surface2)"}}>
            <div className="h2">2) Sponsor a Cohort</div>
            <div className="muted">Sponsor a group of learners (e.g., NGO program).</div>
            <label style={{marginTop:10}}>Cohort size</label>
            <input value={String(cohortSize)} onChange={(e)=>setCohortSize(Number(e.target.value||"0"))} />
            <div className="row" style={{marginTop:12}}>
              <button className="btn primary" onClick={()=>start("cohort")}>Sponsor Cohort</button>
            </div>
          </div>

          <div className="card col-4" style={{background:"var(--surface2)"}}>
            <div className="h2">3) Donate to the Learning Pool</div>
            <div className="muted">Flexible donation used to unlock learning access.</div>
            <label style={{marginTop:10}}>Amount (min 5)</label>
            <input value={String(poolAmount)} onChange={(e)=>setPoolAmount(Number(e.target.value||"0"))} />
            <div className="row" style={{marginTop:12}}>
              <button className="btn primary" onClick={()=>start("pool")}>Donate</button>
            </div>
          </div>
        </div>

        {msg && <div className="muted" style={{marginTop:12, whiteSpace:"pre-wrap"}}>{msg}</div>}

        <div className="row" style={{marginTop:16}}>
          <Link className="btn" href="/compassionate-give">Learn more</Link>
          <Link className="btn" href="/portal/sponsorships">Learner support</Link>
          <Link className="btn" href="/partners">Partner (NGO/Gov)</Link>
          <Link className="btn" href="/legacy-giving">Legacy Giving</Link>
          <Link className="btn" href="/verify-receipt">Verify receipt</Link>
          <button className="btn" onClick={refresh}>Refresh impact</button>
        </div>
      </div>

      <div className="card col-12">
        <div className="h2">Live impact dashboard</div>
        <div className="muted">Privacy-safe totals (no personal data). Allocations use fairness matching.</div>
        <hr />
        {!stats && <div className="muted">Impact totals will appear after the API is running.</div>}
        {stats && (
          <div className="grid">
            <div className="card col-3" style={{background:"var(--surface2)"}}>
              <div className="muted">Total sponsorships</div>
              <div className="h2">{stats.sponsorships}</div>
            </div>
            <div className="card col-3" style={{background:"var(--surface2)"}}>
              <div className="muted">Total funded (paid)</div>
              <div className="h2">{money(stats.paid_amount_cents, currency)}</div>
            </div>
            <div className="card col-3" style={{background:"var(--surface2)"}}>
              <div className="muted">Learners supported</div>
              <div className="h2">{stats.unique_learners_supported}</div>
            </div>
            <div className="card col-3" style={{background:"var(--surface2)"}}>
              <div className="muted">Pending (unpaid)</div>
              <div className="h2">{money(stats.pending_amount_cents, currency)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="card col-12">
        <div className="h2">Impact breakdown</div>
        <div className="muted">Top countries, languages, and accessibility needs supported.</div>
        <hr />
        {!breakdown && <div className="muted">Breakdown will appear after allocations exist.</div>}
        {breakdown && (
          <div className="grid">
            <BarList title="Countries" items={breakdown.countries || []} />
            <BarList title="Languages" items={breakdown.languages || []} />
            <BarList title="Accessibility needs" items={breakdown.accessibility || []} />
          </div>
        )}

<div className="card col-12">
  <div className="h2">Legacy totals</div>
  <div className="muted">Verified legacy gifts received through executor/solicitor transfers (privacy-safe totals).</div>
  <hr />
  {!legacy && <div className="muted">Legacy totals will appear after the API is running.</div>}
  {legacy && (
    <div className="grid">
      <div className="card col-4" style={{background:"var(--surface2)"}}>
        <div className="muted">Verified gifts</div>
        <div className="h2">{legacy.verified_gifts}</div>
      </div>
      <div className="card col-4" style={{background:"var(--surface2)"}}>
        <div className="muted">Verified amount</div>
        <div className="h2">{money(legacy.verified_amount_cents, currency)}</div>
      </div>
      <div className="card col-4" style={{background:"var(--surface2)"}}>
        <div className="muted">Intents recorded</div>
        <div className="h2">{legacy.intents}</div>
      </div>
    </div>
  )}
  <div className="row" style={{marginTop:12}}>
    <Link className="btn" href="/legacy-giving">Legacy Giving</Link>
          <Link className="btn" href="/verify-receipt">Verify receipt</Link>
    <Link className="btn" href="/legacy-intent">Record intent</Link>
  </div>
</div>
      </div>
    </div>
  );
}
