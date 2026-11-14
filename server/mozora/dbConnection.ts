// Turns MOZORA_DATABASE_URL into node-postgres settings that encrypt AND verify the server.
//
// Why this exists: node-postgres treats `sslmode=require` in a URL as "verify the certificate against
// Node's built-in authorities". Supabase signs its database certificates with its own authority, so
// that check fails before login (SELF_SIGNED_CERT_IN_CHAIN). Dropping verification would make the
// connection encrypted but unauthenticated. Instead, any SSL setting in the URL is removed (in
// node-postgres a URL setting would override the options below) and the connection is verified
// against Supabase's published root certificate.
import type { PoolConfig } from 'pg';

const URL_SSL_PARAMS = ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat', 'ssl'];

export function connectionConfig(databaseUrl: string, ca: string, max = 3): PoolConfig {
  const url = new URL(databaseUrl);
  for (const p of URL_SSL_PARAMS) url.searchParams.delete(p);
  return {
    connectionString: url.toString(),
    ssl: { ca, rejectUnauthorized: true },
    max,
  };
}

// A short, non-sensitive reason for logs: an error code or class name, never a message that could
// contain a URL, a user name or data.
export function errorCode(err: unknown): string {
  if (err && typeof err === 'object') {
    const code = (err as { code?: unknown }).code;
    if (typeof code === 'string' && /^[A-Z0-9_]{2,40}$/.test(code)) return code;
    const name = (err as { name?: unknown }).name;
    if (typeof name === 'string' && /^[A-Za-z]{2,40}$/.test(name)) return name;
  }
  return 'unknown';
}
