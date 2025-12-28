# Readytolearn — Perfect App Monorepo (v3) (2025-12-25)

✅ Upgraded features:
- Password reset (request + confirm)
- Email verification (token-based)
- Admin course builder (admin-only)
- Certificates (issue + verify page + PDF download)
- Referrals (code + tracking)

## Where to paste commands (so nothing breaks)
✅ **Windows:** Paste into **PowerShell** (NOT Command Prompt).  
✅ **VS Code:** Terminal → New Terminal (PowerShell) is safe.

## Local run — ONE COPY/PASTE (PowerShell)
1) Put **Readytolearn_Perfect_Monorepo_v3.zip** in **Downloads**
2) Open **PowerShell**
3) Paste this whole block:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force; `
$zip="$HOME\Downloads\Readytolearn_Perfect_Monorepo_v3.zip"; `
$dest="$HOME\Downloads\Readytolearn_Perfect_Monorepo_v3"; `
if (Test-Path $dest) { Remove-Item -Recurse -Force $dest } ; `
Expand-Archive -Force $zip $dest ; `
cd $dest ; `
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { npm i -g pnpm } ; `
pnpm i ; `
$env:PUBLIC_WEB_URL='http://localhost:3000'; `
pnpm -C apps/api db:up ; `
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$dest`"; `$env:PUBLIC_WEB_URL='http://localhost:3000'; pnpm -C apps/api dev" ; `
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$dest`"; `$env:NEXT_PUBLIC_API_URL='http://localhost:5050'; pnpm -C apps/web dev" ; `
Write-Host "✅ API: http://localhost:5050/health"; `
Write-Host "✅ Web: http://localhost:3000/portal"
```

## What to click after it starts
- Auth: `http://localhost:3000/portal/auth`
- Reset password: `/portal/reset/request`
- Verify email: `/portal/verify?token=...`
- Referrals: `/portal/referrals`
- Certificates: `/portal/certificates`
- Admin: `/portal/admin` (admin role required)

## Go live (Render Blueprint)
- Upload to GitHub
- Render → New → Blueprint
- Set `STRIPE_SECRET_KEY`
- Deploy



## Marketing pages (new in v3.1)
- Home: /
- About: /about
- Compassionate Give: /compassionate-give
- Sponsors: /sponsors
- Partners: /partners
- Investors: /investors
- Careers: /careers
- Legal: /legal/terms, /legal/privacy, /legal/accessibility


## Compassionate Give (Sponsors) — v3.2
- Sponsors page: /sponsors (3 sponsorship types + live impact dashboard)
- API endpoints: /sponsorships/create-session, /sponsorships/stats
- Stripe webhook: /webhooks/stripe (set STRIPE_WEBHOOK_SECRET)


## Compassionate Give — Fairness matching (v3.3)
- Learners apply: POST /sponsorships/apply (requires login)
- Matching is automatic on successful sponsorship payment (Stripe webhook) using a rule-based score:
  1) accessibility needs count (higher first)
  2) economic barrier = true
  3) oldest application first
- Breakdown endpoint: GET /sponsorships/breakdown
- Learner UI: /portal/sponsorships


## v3.4 — Sponsored certificate credits + admin review toggle
- Sponsorship kind=certificate now grants learners 1 certificate credit on allocation
- Learners redeem: POST /certificates/issue-from-credit
- View credits: GET /user/certificate-credits
- Admin review UI: /portal/admin/sponsorships
- Toggle auto allocation: SPONSORSHIP_AUTO_ALLOCATE=true|false


## Legacy Giving (v3.5)
- Public page: /legacy-giving
- PDF templates: /legacy/Readytolearn_Legacy_Giving_Templates.pdf
- Legal: informational only (no legal/tax advice; executor/solicitor handles estates)


## Legacy Giving (v3.6)
- Public legacy info: /legacy-giving
- Non-binding intent form: /legacy-intent (POST /legacy/intent)
- Legacy stats: GET /legacy/stats
- Admin: /portal/admin/legacy (intents + gift recording)


## v3.7 — Legacy receipts + yearly exports
- Admin receipt PDF: GET /admin/legacy/gifts/receipt/:id.pdf
- Admin CSV export: GET /admin/legacy/export.csv?year=YYYY
- Admin impact PDF: GET /admin/legacy/report/YYYY.pdf
- Admin UI buttons: /portal/admin/legacy


## v3.8 — Tamper-evident legacy receipts
- Receipt numbers: LG-YYYY-###### (generated on verified gift record)
- Receipt hash: SHA-256 over receipt payload + RECEIPT_HASH_SECRET
- Admin verify endpoint: GET /admin/legacy/gifts/verify/:id
- Receipt PDF now includes watermark + receipt number + hash


## v3.9 — Public receipt verification
- Public API: GET /legacy/receipts/verify?receiptNumber=...&receiptHash=...
- Public page: /verify-receipt
- Privacy: shows only minimal details for verified receipts
