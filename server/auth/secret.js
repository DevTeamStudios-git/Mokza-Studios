/* Shared password/code hashing used by the API and by scripts/check-staff-login.js.
 * Keeping it in one module means the login check and the local verifier can never drift apart.
 *
 * Stored format (preferred):  scrypt$<salt-hex>$<key-hex>
 * Also accepted (legacy):     a bare unsalted sha256 hex digest
 * Generate one with:          node scripts/hash-password.js
 */
import crypto from 'node:crypto';

const SCRYPT_PREFIX = 'scrypt$';
const SCRYPT_KEY_BYTES = 64;

export function hashSecret(input) {
  const salt = crypto.randomBytes(16).toString('hex');
  return SCRYPT_PREFIX + salt + '$' + crypto.scryptSync(input, salt, SCRYPT_KEY_BYTES).toString('hex');
}

export function checkSecret(input, stored) {
  try {
    stored = String(stored || '');
    if (stored.indexOf(SCRYPT_PREFIX) === 0) {
      const parts = stored.split('$');
      if (parts.length !== 3) return false;
      const want = Buffer.from(parts[2], 'hex');
      // reject a malformed/truncated key instead of comparing against a short buffer
      if (!parts[1] || !want.length || want.length * 2 !== parts[2].length) return false;
      const got = crypto.scryptSync(input, parts[1], want.length);
      return crypto.timingSafeEqual(got, want);
    }
    const got = Buffer.from(crypto.createHash('sha256').update(input).digest('hex'));
    const want = Buffer.from(stored);
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  } catch (_) {
    return false;
  }
}

/* Describes the SHAPE of a stored hash for logs and diagnostics.
 * Never returns any part of the hash, the salt or the secret itself. */
export function describeSecret(stored) {
  stored = String(stored || '');
  if (!stored) return 'missing/empty';
  if (stored.indexOf(SCRYPT_PREFIX) === 0) {
    const parts = stored.split('$');
    if (parts.length !== 3) return 'malformed scrypt (expected 3 $-separated parts, got ' + parts.length + ' — a shell may have eaten the $ signs; paste it in the Vercel dashboard instead)';
    const keyHex = parts[2];
    const bytes = Buffer.from(keyHex, 'hex');
    if (!parts[1]) return 'malformed scrypt (empty salt)';
    if (!bytes.length) return 'malformed scrypt (key is not hex)';
    if (bytes.length * 2 !== keyHex.length) return 'malformed scrypt (key is not valid hex: ' + keyHex.length + ' chars, only ' + bytes.length * 2 + ' usable)';
    if (bytes.length !== SCRYPT_KEY_BYTES) return 'scrypt, unusual key length ' + bytes.length + ' bytes (expected ' + SCRYPT_KEY_BYTES + ')';
    return 'well-formed scrypt (salt ' + parts[1].length + ' chars, key ' + bytes.length + ' bytes)';
  }
  if (/^[0-9a-f]{64}$/i.test(stored)) return 'legacy unsalted sha256 hex (works, but re-hash with scrypt when you can)';
  return 'unrecognized format (' + stored.length + ' chars, no "scrypt$" prefix and not a 64-char sha256 hex)';
}
