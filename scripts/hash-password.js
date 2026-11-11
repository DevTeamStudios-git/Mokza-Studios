// Usage:
//   node scripts/hash-password.js                 -> prompts for a value, prints a salted scrypt hash
//   node scripts/hash-password.js --secret        -> prints a random 64-char value for AUTH_SECRET
// Put the hash into STAFF_ACCOUNTS (or STAFF_SECURITY_CODE_HASH) in your environment, never into source code.
import crypto from 'node:crypto';
import readline from 'node:readline';

if (process.argv.includes('--secret')) {
  console.log(crypto.randomBytes(32).toString('hex'));
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Value to hash (visible as you type, clear your terminal after): ', (v) => {
  rl.close();
  if (!v) { console.error('Empty value.'); process.exit(1); }
  const salt = crypto.randomBytes(16).toString('hex');
  console.log('scrypt$' + salt + '$' + crypto.scryptSync(v, salt, 64).toString('hex'));
});
