// Creates login passwords for the two Mozora database roles WITHOUT the plaintext ever reaching
// Postgres, its logs, or anyone but you.
//
// Why: `ALTER ROLE ... PASSWORD 'plaintext'` can end up in database logs. Postgres also accepts a
// pre-computed SCRAM-SHA-256 verifier (a one-way hash); then only the hash is ever sent.
//
// What it does, all on your machine:
//   1. generates a long random password for mozora_app and one for mozora_migrator
//   2. prints two ALTER ROLE statements containing only SCRAM verifiers, to run in Supabase
//   3. writes the two connection URLs (with the passwords) to mozora/.env.local, which git ignores
//
// Usage:
//   node mozora/scripts/make-db-login.mjs --project-ref <dev-ref>
//   node mozora/scripts/make-db-login.mjs --self-test     (checks the hashing against RFC 7677)
//
// It refuses the production project. Production logins are created later, by the owner, through the
// reviewed migration process (D12).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const PRODUCTION_REF = 'pgxgfhqwzkdayhbyqfvl';
const ITERATIONS = 4096;

const hmac = (key, msg) => crypto.createHmac('sha256', key).update(msg).digest();
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest();
const salted = (pw, salt, iter) => crypto.pbkdf2Sync(Buffer.from(pw, 'utf8'), salt, iter, 32, 'sha256');

export function scramVerifier(password, salt = crypto.randomBytes(16), iter = ITERATIONS) {
  const sp = salted(password, salt, iter);
  const storedKey = sha256(hmac(sp, 'Client Key'));
  const serverKey = hmac(sp, 'Server Key');
  return `SCRAM-SHA-256$${iter}:${salt.toString('base64')}$${storedKey.toString('base64')}:${serverKey.toString('base64')}`;
}

// RFC 7677 section 3 test vector (user "user", password "pencil").
function selfTest() {
  const salt = Buffer.from('W22ZaJ0SNY7soEsUEjb6gQ==', 'base64');
  const sp = salted('pencil', salt, 4096);
  const clientKey = hmac(sp, 'Client Key');
  const storedKey = sha256(clientKey);
  const serverKey = hmac(sp, 'Server Key');
  const auth =
    'n=user,r=rOprNGfwEbeRWgbNEkqO,' +
    'r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0,s=W22ZaJ0SNY7soEsUEjb6gQ==,i=4096,' +
    'c=biws,r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0';
  const sig = hmac(storedKey, auth);
  const proof = Buffer.from(clientKey.map((b, i) => b ^ sig[i])).toString('base64');
  const checks = [
    ['client proof matches RFC 7677', proof === 'dHzbZapWIk4jUhN+Ute9ytag9zjfMHgsqmmiz7AndVQ='],
    ['server signature matches RFC 7677', hmac(serverKey, auth).toString('base64') === '6rriTRBi23WpRR/wtup+mMhUZUn/dB5nLTJRsjl95G4='],
    ['verifier has the pg_authid format', /^SCRAM-SHA-256\$4096:[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]{44}:[A-Za-z0-9+/=]{44}$/.test(scramVerifier('pencil', salt))],
  ];
  for (const [name, ok] of checks) console.log((ok ? 'PASS  ' : 'FAIL  ') + name);
  process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
}

function randomPassword(len = 40) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[crypto.randomInt(chars.length)];
  return s; // letters and digits only: no quoting or URL-encoding problems, about 238 bits
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) return selfTest();
  const ref = args[args.indexOf('--project-ref') + 1];
  if (!args.includes('--project-ref') || !ref || !/^[a-z]{20}$/.test(ref)) {
    console.error('Usage: node mozora/scripts/make-db-login.mjs --project-ref <20-letter dev project ref>');
    process.exit(2);
  }
  if (ref === PRODUCTION_REF) {
    console.error('Refusing: that is the production project. Production logins go through the reviewed process (D12).');
    process.exit(2);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('\nIn Supabase, open the DEV project > Connect (top bar) > Connection string > Session pooler.');
  rl.question('Paste that string here (it contains [YOUR-PASSWORD], which is fine):\n> ', (raw) => {
    rl.close();
    let u;
    try {
      u = new URL(String(raw).trim().replace('[YOUR-PASSWORD]', 'x'));
    } catch {
      console.error('\nThat is not a connection string. It should start with postgresql://');
      process.exit(1);
    }
    if (!/\.pooler\.supabase\.com$/.test(u.hostname)) {
      console.error('\nThat host is not a Supabase pooler (*.pooler.supabase.com). Copy the "Session pooler" string.');
      process.exit(1);
    }
    if (!decodeURIComponent(u.username).endsWith('.' + ref)) {
      console.error(`\nThat string belongs to another project (expected a user ending in .${ref}).`);
      process.exit(1);
    }
    const db = (u.pathname || '/postgres').slice(1) || 'postgres';
    const appPw = randomPassword();
    const migPw = randomPassword();
    // Runtime: session pooler (5432). Migrations: the same pooler, with the schema parameter Prisma
    // uses for its bookkeeping table (docs/mozora-decisions.md, S-F).
    const appUrl = `postgresql://mozora_app.${ref}:${appPw}@${u.hostname}:5432/${db}?sslmode=require`;
    const migUrl = `postgresql://mozora_migrator.${ref}:${migPw}@${u.hostname}:5432/${db}?sslmode=require&schema=mozora`;

    const here = path.dirname(fileURLToPath(import.meta.url));
    const envFile = path.resolve(here, '../.env.local');
    fs.writeFileSync(
      envFile,
      `# Mozora DEV project ${ref}. Generated by mozora/scripts/make-db-login.mjs. Never commit.\n` +
        `MOZORA_DATABASE_URL=${appUrl}\nMOZORA_DIRECT_URL=${migUrl}\n`,
      { mode: 0o600 },
    );

    const line = '-'.repeat(72);
    console.log(`\n${line}\n1) Run this in Supabase > DEV project > SQL Editor (it contains only one-way hashes):\n${line}`);
    console.log(`alter role mozora_app with login password '${scramVerifier(appPw)}';`);
    console.log(`alter role mozora_migrator with login password '${scramVerifier(migPw)}';`);
    console.log(`\n${line}\n2) The two connection URLs were written to:\n   ${envFile}\n${line}`);
    console.log('Open that file to copy them into Vercel (Preview) and GitHub secrets, as the setup guide');
    console.log('describes. They are not printed here so they do not end up in your terminal history.');
    console.log('If you lose them, run this script again: it makes new passwords.');
  });
}

main();
