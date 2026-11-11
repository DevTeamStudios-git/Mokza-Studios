// Usage:
//   node scripts/hash-password.js            -> prompts for a value, prints a salted scrypt hash
//   node scripts/hash-password.js --secret   -> prints a random 64-char value for AUTH_SECRET
//
// Put the hash into STAFF_ACCOUNTS (or STAFF_SECURITY_CODE_HASH) in your environment, never into
// source code. Paste it in the Vercel dashboard rather than through a shell: the hash contains "$"
// characters that bash/zsh would try to expand, which silently corrupts it.
import crypto from 'node:crypto';
import readline from 'node:readline';
import { hashSecret } from '../server/auth/secret.js';

if (process.argv.includes('--secret')) {
  console.log(crypto.randomBytes(32).toString('hex'));
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Value to hash (visible as you type, clear your terminal after): ', (raw) => {
  rl.close();
  // readline leaves a stray \r on some Windows terminals; it is not part of what you typed
  const v = raw.replace(/[\r\n]+$/, '');
  if (!v) {
    console.error('Empty value.');
    process.exit(1);
  }
  if (v !== v.trim()) {
    console.warn('\n⚠️  Your value starts or ends with a space. That space IS part of the password.');
    console.warn('   If you did not mean to type it, run this again.\n');
  }
  console.log(hashSecret(v));
});
