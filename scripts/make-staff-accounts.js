/* Builds a complete STAFF_ACCOUNTS value in one pass: it asks for each staff password,
 * hashes it with salted scrypt, and prints the finished JSON ready to paste into Vercel.
 *
 * Usage, from the project root:
 *   node scripts/make-staff-accounts.js
 *   node scripts/make-staff-accounts.js --show      (echo what you type, if your terminal
 *                                                    swallows the hidden prompt)
 *
 * Passwords are hashed locally and never written to disk, printed, or sent anywhere.
 * Press Enter on a password to skip that account; skipped accounts cannot sign in.
 */
import readline from 'node:readline';
import { hashSecret } from '../server/auth/secret.js';

// name -> rank. Edit this list if your team changes.
const STAFF = [
  ['ThéoDevO', 'Owner'],
  ['GabrielDevCoO', 'CoOwner'],
  ['NeuraXIDev', 'Developer'],
  ['AprenticeDev', 'Apprentice'],
];

const SHOW = process.argv.includes('--show');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });

// Buffer lines so the script also works when input is piped, not just typed.
const pending = [];
const waiting = [];
let ended = false;
rl.on('line', (line) => (waiting.length ? waiting.shift()(line) : pending.push(line)));
rl.on('close', () => {
  ended = true;
  while (waiting.length) waiting.shift()('');
});

let muted = false;
if (!SHOW && process.stdin.isTTY) {
  const write = rl._writeToOutput ? rl._writeToOutput.bind(rl) : null;
  rl._writeToOutput = function (str) {
    if (!muted) return write ? write(str) : process.stdout.write(str);
    // keep the prompt visible, hide the typed characters
    const keep = String(str).replace(/[^\r\n]/g, '');
    if (keep) process.stdout.write(keep);
  };
}

function ask(prompt, secret) {
  process.stdout.write(prompt);
  muted = !!secret && !SHOW && !!process.stdin.isTTY;
  const done = (line) => {
    muted = false;
    if (secret && !SHOW && process.stdin.isTTY) process.stdout.write('\n');
    // readline leaves a stray \r on some Windows terminals; it is not part of what you typed
    return String(line).replace(/[\r\n]+$/, '');
  };
  if (pending.length) return Promise.resolve(done(pending.shift()));
  if (ended) return Promise.resolve(done(''));
  return new Promise((res) => waiting.push((line) => res(done(line))));
}

(async () => {
  console.log('\nEnter each password as you type it into the Dev Mode login form.');
  console.log('Press Enter alone to skip an account.\n');

  const out = {};
  const skipped = [];
  for (const [name, rank] of STAFF) {
    const pw = await ask('  ' + name + ' (' + rank + ') password: ', true);
    if (!pw) {
      skipped.push(name);
      continue;
    }
    if (pw !== pw.trim()) {
      console.log('    ⚠️  starts or ends with a space — that space is part of the password.');
    }
    out[name] = { hash: hashSecret(pw), rank };
  }

  const code = await ask('\n  Security code (optional, Enter to leave it off): ', true);
  rl.close();

  if (!Object.keys(out).length) {
    console.error('\nNo passwords entered, nothing to do.');
    process.exit(1);
  }

  console.log('\n' + '─'.repeat(72));
  console.log('STAFF_ACCOUNTS  (one line — copy everything after the "=" sign)');
  console.log('─'.repeat(72));
  console.log(JSON.stringify(out));
  if (code) {
    console.log('\n' + '─'.repeat(72));
    console.log('STAFF_SECURITY_CODE_HASH');
    console.log('─'.repeat(72));
    console.log(hashSecret(code));
  }
  console.log('\n' + '─'.repeat(72));
  console.log('PASTE these in the Vercel dashboard (Settings → Environment Variables).');
  console.log('Do NOT pipe them through a shell: bash/zsh expand the "$" and corrupt the hash.');
  if (!code) console.log('No security code given: delete STAFF_SECURITY_CODE_HASH in Vercel, or the');
  if (!code) console.log('login form will keep demanding a code that nothing can satisfy.');
  if (skipped.length) console.log('Skipped (cannot sign in): ' + skipped.join(', '));
  console.log('Then redeploy, and verify with:  node scripts/check-staff-login.js');
  console.log('Clear your terminal afterwards.');
})();
