/* Checks a STAFF_ACCOUNTS value the same way the live API does, on your own machine.
 * It never prints a password, a security code or any hash value — only names and hash shapes.
 *
 * Usage, from the project root:
 *   1. Put the STAFF_ACCOUNTS value in a file (easiest: copy it out of the Vercel dashboard):
 *        node scripts/check-staff-login.js staff.json
 *      ...or rely on your local .env / shell:
 *        node scripts/check-staff-login.js
 *   2. It lists each account and whether its hash is well-formed.
 *   3. It then offers to test one username + password, exactly as the server would.
 *
 * Delete the file afterwards; it holds your password hashes.
 */
import fs from 'node:fs';
import readline from 'node:readline';
import { checkSecret, describeSecret } from '../server/auth/secret.js';

const file = process.argv[2];
let raw = '';
if (file) {
  try {
    raw = fs.readFileSync(file, 'utf8').trim();
  } catch (e) {
    console.error('Could not read ' + file + ': ' + e.message);
    process.exit(1);
  }
} else {
  raw = (process.env.STAFF_ACCOUNTS || '').trim();
  if (!raw) {
    try {
      const env = fs.readFileSync('.env', 'utf8');
      const m = env.match(/^STAFF_ACCOUNTS\s*=\s*(.*)$/m);
      if (m) raw = m[1].trim().replace(/^['"]|['"]$/g, '');
    } catch (_) {}
  }
}

if (!raw) {
  console.error('No STAFF_ACCOUNTS found. Pass a file: node scripts/check-staff-login.js staff.json');
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  console.error('✗ STAFF_ACCOUNTS is not valid JSON: ' + e.message);
  console.error('  The server treats unparseable JSON as "no staff accounts", so every login fails.');
  process.exit(1);
}
if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
  console.error('✗ STAFF_ACCOUNTS must be a JSON object, e.g. {"Name":{"hash":"scrypt$...","rank":"Owner"}}');
  process.exit(1);
}

const RANKS = ['Owner', 'CoOwner', 'Developer', 'Apprentice'];
const names = Object.keys(parsed);
console.log('\nSTAFF_ACCOUNTS parsed: ' + names.length + ' account(s)\n');
let usable = 0;
for (const name of names) {
  const e = parsed[name] || {};
  const shape = describeSecret(e.hash);
  const rankOk = RANKS.indexOf(e.rank) >= 0;
  const ok = shape.indexOf('well-formed') === 0 || shape.indexOf('legacy') === 0;
  if (ok && rankOk) usable++;
  console.log((ok && rankOk ? '  ✓ ' : '  ✗ ') + JSON.stringify(name));
  console.log('      rank: ' + (rankOk ? e.rank : JSON.stringify(e.rank) + '  <-- must be one of ' + RANKS.join(', ')));
  console.log('      hash: ' + shape);
  if (name !== name.normalize('NFC')) {
    console.log('      note: the name is not in NFC Unicode form; the server now matches either form.');
  }
}
console.log('\n' + usable + ' of ' + names.length + ' account(s) usable for login.\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

/* Buffer incoming lines: readline drops a line that arrives while no question is pending,
 * which happens whenever input is piped rather than typed. */
const pendingLines = [];
const waiting = [];
let inputEnded = false;
rl.on('line', (line) => (waiting.length ? waiting.shift()(line) : pendingLines.push(line)));
rl.on('close', () => {
  inputEnded = true;
  while (waiting.length) waiting.shift()('');
});
function ask(q) {
  process.stdout.write(q);
  if (pendingLines.length) return Promise.resolve(pendingLines.shift());
  if (inputEnded) return Promise.resolve('');
  return new Promise((res) => waiting.push(res));
}

const norm = (x) => String(x).normalize('NFC').toLowerCase();

(async () => {
  const u = (await ask('Test a login? Username (blank to quit): ')).replace(/[\r\n]+$/, '').trim();
  if (!u) {
    rl.close();
    return;
  }
  const match = names.find((k) => norm(k) === norm(u)) || null;
  if (!match) {
    console.log('\n✗ No account matches that username. The server would log "unknown username".');
    rl.close();
    return;
  }
  console.log('  matched account: ' + JSON.stringify(match));
  const p = (await ask('Password (visible as you type): ')).replace(/[\r\n]+$/, '');
  rl.close();
  if (p !== p.trim()) console.log('\n⚠️  What you typed starts or ends with a space.');
  console.log(
    checkSecret(p, parsed[match].hash)
      ? '\n✓ This password MATCHES the stored hash. The server would accept it.\n  If the live site still refuses it, the value deployed in Vercel differs from this one.'
      : '\n✗ This password does NOT match the stored hash — the same failure the live site reports.\n  Re-generate with  node scripts/hash-password.js  and paste the new hash into Vercel.'
  );
})();
