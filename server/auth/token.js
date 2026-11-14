/* Host session token: { uid, exp } signed with HMAC-SHA256 under AUTH_SECRET.
 * Imported by the host API and by Mozora so both verify tokens identically. Never copy it.
 *
 * Serverless functions don't share memory, so sessions are signed tokens, not Maps.
 * No fallback to other secrets or a public literal: a guessable signing key means forgeable Owner tokens.
 * Without a strong secret, sign-in is switched off (public read endpoints keep working) instead of crashing. */
import crypto from 'node:crypto';

const IS_PROD = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
const AUTH_SECRET = process.env.AUTH_SECRET || (IS_PROD ? '' : crypto.randomBytes(32).toString('hex'));

export const AUTH_ENABLED = AUTH_SECRET.length >= 32;
if (!AUTH_ENABLED) console.error('[Auth] AUTH_SECRET is missing or shorter than 32 chars: sign-in and all staff-only routes are DISABLED. Generate one with: node scripts/hash-password.js --secret');
else if (!process.env.AUTH_SECRET) console.warn('[Auth] AUTH_SECRET not set: using a random per-process secret (sessions reset on restart). Dev only.');

// Lifetime the host gives every session token it issues.
export const TOKEN_TTL_MS = 90 * 24 * 3600 * 1000;

const b64u = (b) => Buffer.from(b).toString('base64url');

export function sign(payload) {
  if (!AUTH_ENABLED) throw new Error('auth disabled');
  const body = b64u(JSON.stringify(payload));
  return body + '.' + crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
}

// Returns the payload of a valid, unexpired token, otherwise null.
export function verify(tok) {
  if (!AUTH_ENABLED) return null;
  if (!tok || typeof tok !== 'string' || tok.indexOf('.') < 0) return null;
  const [body, sig] = tok.split('.');
  const good = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return p.exp && p.exp > Date.now() ? p : null;
  } catch (_) {
    return null;
  }
}

// Token from an "Authorization: Bearer <token>" header; the query string is never accepted.
export function bearerToken(req) {
  const h = String(req.headers.authorization || '');
  return /^Bearer /i.test(h) ? h.slice(7).trim() : null;
}
