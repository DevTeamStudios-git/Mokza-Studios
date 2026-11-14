// Database access for Mozora. Connects as `mozora_app` through MOZORA_DATABASE_URL (Supabase pooled
// connection). Fails closed: with no URL, or when the database is unreachable, callers get an error
// and the API answers 503. There is no file or memory fallback for member data (brief section 6).
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../mozora/generated/prisma/client.js';

export class MozoraUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MozoraUnavailable';
  }
}

let client: InstanceType<typeof PrismaClient> | null = null;

export function prisma(): InstanceType<typeof PrismaClient> {
  if (client) return client;
  const url = process.env.MOZORA_DATABASE_URL;
  if (!url) throw new MozoraUnavailable('MOZORA_DATABASE_URL is not set');
  // Small pool per serverless instance: Mozora shares the project's connection limits with the host.
  client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 3 }) });
  return client;
}

export async function pingDatabase(): Promise<void> {
  try {
    await prisma().$queryRaw`select 1`;
  } catch (err) {
    if (err instanceof MozoraUnavailable) throw err;
    throw new MozoraUnavailable('database unreachable');
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
    throw new MozoraUnavailable('identity lookup failed');
  }
  return rows[0] ?? null;
}
