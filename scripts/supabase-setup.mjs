// EcoLedger production setup + verification.
// Usage (from the repo root):
//   set SUPABASE_ACCESS_TOKEN=sbp_...   (PowerShell: $env:SUPABASE_ACCESS_TOKEN="sbp_...")
//   node scripts/supabase-setup.mjs
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const REF = 'ihjooawueqocqpmdbjwi'
const API = `https://api.supabase.com/v1/projects/${REF}`
const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) { console.error('Set SUPABASE_ACCESS_TOKEN first'); process.exit(2) }
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

async function api(path, method = 'GET', body) {
  const r = await fetch(API + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined })
  const t = await r.text()
  if (!r.ok) throw new Error(`${method} ${path} → HTTP ${r.status}: ${t}`)
  try { return JSON.parse(t) } catch { return t }
}
const sql = q => api('/database/query', 'POST', { query: q })
const step = async (name, fn) => {
  try { const out = await fn(); console.log(`✔ ${name}${out ? ` — ${out}` : ''}`) }
  catch (e) { console.log(`✘ ${name} — ${e.message}`); process.exitCode = 1 }
}

// 1. Database: one-email-one-identity migration (transactional)
await step('Migration 20261114_one_email_one_identity', async () => {
  const m = readFileSync('supabase/migrations/20261114_one_email_one_identity.sql', 'utf8')
  await sql(`BEGIN;\n${m}\nCOMMIT;`)
  const [r] = await sql(`select count(*)::int n from pg_trigger where tgname in ('trg_access_requests_email','trg_invitations_email')`)
  return `${r.n}/2 triggers installed`
})

// 3. Auth: sign-up email carries the one-time code
await step('Auth "Confirm signup" template with {{ .Token }}', async () => {
  const html = readFileSync('supabase/templates/confirm-signup.html', 'utf8')
  await api('/config/auth', 'PATCH', {
    mailer_templates_confirmation_content: html,
    mailer_subjects_confirmation: 'Your EcoLedger verification code',
    mailer_autoconfirm: false,
  })
  const c = await api('/config/auth')
  return `template has code: ${String(c.mailer_templates_confirmation_content).includes('{{ .Token }}')}, confirm email ON: ${!c.mailer_autoconfirm}`
})

// 4. Deploy the notify function (nodemailer over 465, CORS, re-read invitations, SMTP self-test)
await step('Deploy notify function', async () => {
  execSync(`npx --yes supabase@2 functions deploy notify --project-ref ${REF} --use-api`, {
    stdio: 'inherit', env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
  })
})

// 5. Verify functions end to end
const keys = await api('/api-keys')
const anon = keys.find(k => k.name === 'anon')?.api_key
const service = keys.find(k => k.name === 'service_role')?.api_key
const fn = (name, key, body) => fetch(`https://${REF}.supabase.co/functions/v1/${name}`, {
  method: body ? 'POST' : 'GET',
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Origin: 'https://liberiaecoledger.com' },
  body: body ? JSON.stringify(body) : undefined,
})

await step('public-stats responds', async () => {
  const r = await fn('public-stats', anon); const j = await r.json()
  if (!r.ok) throw new Error(`HTTP ${r.status}`); return `devices=${j.devices} events=${j.lifecycleEvents}`
})
await step('notify rejects forged invitation tokens (and sends CORS headers)', async () => {
  const r = await fn('notify', anon, { type: 'RESEND', table: 'invitations', record: { token: 'ECO-NOPE-NOPE' } })
  if (r.status !== 404) throw new Error(`expected 404, got ${r.status}: ${await r.text()}`)
  return `CORS: ${r.headers.get('access-control-allow-origin')}`
})
await step('SMTP delivery (test email to the support mailbox)', async () => {
  const r = await fn('notify', service, { type: 'SMTP_TEST' }); const j = await r.json()
  if (!r.ok || !j.ok) throw new Error(j.error ?? `HTTP ${r.status}`); return `sent to ${j.sent.join(', ')}`
})
await step('Database RPCs reachable (public ledger + rates)', async () => {
  const r = await fetch(`https://${REF}.supabase.co/rest/v1/rpc/public_ledger`, {
    method: 'POST', headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' }, body: '{"p_limit":3}',
  })
  const rates = await fetch(`https://${REF}.supabase.co/rest/v1/platform_rates?select=key,value`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } })
  if (!r.ok || !rates.ok) throw new Error(`ledger ${r.status}, rates ${rates.status}`)
  return `ledger rows=${(await r.json()).length}, rates=${(await rates.json()).length}`
})
