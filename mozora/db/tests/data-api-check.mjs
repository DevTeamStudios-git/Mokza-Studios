// Data API layer of D12: with the project's publishable key, schema `mozora` must not be exposed at
// all, and the host identity table must refuse access. Run against the DEV project:
//   SUPABASE_URL=https://<dev-ref>.supabase.co PUBLISHABLE_KEY=sb_publishable_... node mozora/db/tests/data-api-check.mjs
const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '') + '/rest/v1';
const key = process.env.PUBLISHABLE_KEY || '';
if (!process.env.SUPABASE_URL || !key) {
  console.error('Set SUPABASE_URL and PUBLISHABLE_KEY');
  process.exit(2);
}

async function call(path, init = {}) {
  const res = await fetch(base + path, { ...init, headers: { apikey: key, ...(init.headers || {}) } });
  let body = {};
  try { body = await res.json(); } catch { body = {}; }
  return { status: res.status, code: body.code };
}

const checks = [
  ['read mozora table via Accept-Profile', () => call('/mozora_session?select=id', { headers: { 'Accept-Profile': 'mozora' } }), (r) => r.code === 'PGRST106'],
  ['write mozora table via Content-Profile', () => call('/mozora_session', { method: 'POST', headers: { 'Content-Profile': 'mozora', 'Content-Type': 'application/json' }, body: '{}' }), (r) => r.code === 'PGRST106'],
  ['read host identity table', () => call('/user_accounts?select=id'), (r) => r.code === '42501' || r.status === 401 || r.status === 403],
  ['write host identity table', () => call('/user_accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"id":"x","provider":"x"}' }), (r) => r.code === '42501' || r.status === 401 || r.status === 403],
];

let failed = 0;
for (const [name, run, ok] of checks) {
  const r = await run();
  const pass = ok(r);
  if (!pass) failed++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  (HTTP ${r.status}${r.code ? ', ' + r.code : ''})`);
}
process.exit(failed ? 1 : 0);
