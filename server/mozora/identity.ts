// Who is calling. Uses the host's shared token verifier (D1), then reads the CURRENT rank from
// user_accounts on every request. Never trusts a rank or a user object carried inside a token, and
// rejects legacy tokens that have no `uid` (the host may upgrade those; Mozora does not).
import type { Request } from 'express';
import { bearerToken, verify } from '../auth/token.js';
import { capabilityFor } from './config/roleMap.js';
import { findHostAccount, type HostIdentity } from './db.js';
import type { Subject } from './policy/can.js';

export type AccountLookup = (id: string) => Promise<HostIdentity | null>;

export type Identity = { subject: Subject; account: HostIdentity | null };

export async function resolveIdentity(req: Request, lookup: AccountLookup = findHostAccount): Promise<Identity> {
  const payload = verify(bearerToken(req)) as { uid?: unknown } | null;
  const uid = payload && typeof payload.uid === 'string' ? payload.uid : null;
  if (!uid) return { subject: { signedIn: false }, account: null };
  const account = await lookup(uid);
  if (!account) return { subject: { signedIn: false }, account: null };
  return {
    subject: { signedIn: true, userId: account.id, capability: capabilityFor(account.rank), mode: 'admin' },
    account,
  };
}
