/* Host accounts (table public.user_accounts) and request authentication.
 * Imported by the host API and by Mozora. Never copy it.
 *
 * The rank is ALWAYS read from user_accounts on every request. Never trust a rank carried in a
 * token or in an OAuth profile object.
 *
 * Without a database the host falls back to a local JSON file (dev only; a silent no-op on Vercel's
 * read-only filesystem). Callers that must fail closed, such as Mozora, check `isDatabaseBacked`. */
import fs from 'node:fs';
import path from 'node:path';
import { supabase } from '../supabase/client.js';
import { RANK_LEVEL, RANK_PERMISSIONS } from './ranks.js';
import { verify, bearerToken } from './token.js';

export const isDatabaseBacked = !!supabase;

// Optional: emails in this env var become Owner on sign-in, so someone can approve the first requests.
const BOOTSTRAP_OWNER_EMAILS = (process.env.BOOTSTRAP_OWNER_EMAILS || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
const ACCOUNTS_FILE = path.resolve(process.cwd(), 'server', 'data', 'accounts.json');

function readAccountsFile() {
  try {
    if (!fs.existsSync(ACCOUNTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  } catch (_) {
    return [];
  }
}

function writeAccountsFile(data) {
  try { fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch (_) {}
}

// Shape the host browser code expects for the signed-in user.
export function accountToUser(a) {
  const rank = RANK_LEVEL[a.rank] !== undefined ? a.rank : 'User';
  return {
    id: a.id, username: a.email || a.name || a.id, email: a.email, name: a.name, picture: a.picture,
    provider: a.provider, rank, permissions: RANK_PERMISSIONS[rank], verified: false,
  };
}

export async function dbGetAccount(id) {
  if (supabase) {
    const { data, error } = await supabase.from('user_accounts').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || null;
  }
  return readAccountsFile().find((a) => a.id === id) || null;
}

export async function dbSaveAccount(acc) {
  if (supabase) {
    const { data, error } = await supabase.from('user_accounts').upsert([acc], { onConflict: 'id' }).select().single();
    if (error) throw error;
    return data;
  }
  const all = readAccountsFile();
  const i = all.findIndex((a) => a.id === acc.id);
  if (i >= 0) all[i] = { ...all[i], ...acc }; else all.push(acc);
  writeAccountsFile(all);
  return i >= 0 ? all[i] : acc;
}

// First sign-in creates a plain "User". Later sign-ins keep whatever rank the account has earned.
export async function upsertLoginAccount(profile) {
  const existing = await dbGetAccount(profile.id);
  const email = (profile.email || '').toLowerCase();
  let rank = existing ? existing.rank : 'User';
  if (email && profile.verified === true && BOOTSTRAP_OWNER_EMAILS.indexOf(email) >= 0 && RANK_LEVEL[rank] < RANK_LEVEL.Owner) rank = 'Owner';
  return dbSaveAccount({
    id: profile.id, email: profile.email || null, name: profile.name || null, picture: profile.picture || null,
    provider: profile.provider, rank, last_login_at: new Date().toISOString(),
    ...(existing ? {} : { created_at: new Date().toISOString() }),
  });
}

// Resolves the bearer token to the account's CURRENT row (and so its current rank); null if not signed in.
export async function authedAccount(req) {
  const p = verify(bearerToken(req));
  if (!p) return null;
  const uid = p.uid || (p.user && p.user.id); // tokens issued before accounts existed carried the whole user
  if (!uid) return null;
  let acc = await dbGetAccount(uid);
  if (!acc && p.user) acc = await upsertLoginAccount({ ...p.user, provider: p.user.provider || 'google' });
  return acc;
}
