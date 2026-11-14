// Database access for Mozora. Connects as `mozora_app` through MOZORA_DATABASE_URL (Supabase pooled
// connection). Fails closed: with no URL, or when the database is unreachable, callers get an error
// and the API answers 503. There is no file or memory fallback for member data (brief section 6).
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../mozora/generated/prisma/client.js';
import { connectionConfig, errorCode } from './dbConnection.js';
import { SUPABASE_ROOT_CA } from './supabaseCa.js';

export class MozoraUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MozoraUnavailable';
  }
}

// Small pool per serverless instance (Mozora shares the project's connection limits with the host),
// encrypted and verified against Supabase's root certificate (see dbConnection.ts).
function createClient(url: string) {
  return new PrismaClient({ adapter: new PrismaPg(connectionConfig(url, SUPABASE_ROOT_CA)) });
}

// Fail closed, but leave a trace: the error code only (never the message, URL or data), so an
// unreachable database can be diagnosed from the function logs.
function unavailable(what: string, err: unknown): MozoraUnavailable {
  const cause = err && typeof err === 'object' ? (err as { cause?: unknown }).cause : undefined;
  const code = errorCode(cause) !== 'unknown' ? errorCode(cause) : errorCode(err);
  console.error(`[mozora] ${what}: ${code}`);
  return new MozoraUnavailable(what);
}

// The client type is inferred from the constructor call. Annotating it as
// InstanceType<typeof PrismaClient> picks the generic defaults (every log level), which does not match
// a client built without a `log` option; strict and non-strict compilers disagree on it.
type MozoraPrisma = ReturnType<typeof createClient>;

let client: MozoraPrisma | null = null;

export function prisma(): MozoraPrisma {
  if (client) return client;
  const url = process.env.MOZORA_DATABASE_URL;
  if (!url) throw new MozoraUnavailable('MOZORA_DATABASE_URL is not set');
  client = createClient(url);
  return client;
}

export async function pingDatabase(): Promise<void> {
  try {
    await prisma().$queryRaw`select 1`;
  } catch (err) {
    if (err instanceof MozoraUnavailable) throw err;
    throw unavailable('database unreachable', err);
  }
}

export type HostIdentity = { id: string; name: string | null; email: string | null; rank: string };

// Reads the four columns `mozora_app` is granted on public.user_accounts (D12). Mozora never writes
// host tables and never creates accounts: an unknown id is simply "not signed in".
export async function findHostAccount(id: string): Promise<HostIdentity | null> {
  let rows: HostIdentity[];
  try {
    rows = await prisma().$queryRaw<HostIdentity[]>`
      select id, name, email, rank from public.user_accounts where id = ${id} limit 1`;
  } catch (err) {
    if (err instanceof MozoraUnavailable) throw err;
    throw unavailable('identity lookup failed', err);
  }
  return rows[0] ?? null;
}
