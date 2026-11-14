import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { sign } from '../../auth/token.js';
import { createMozoraApp } from '../app.js';
import { MozoraUnavailable, type HostIdentity } from '../db.js';

const account = (id: string, rank: string): HostIdentity => ({ id, name: 'Test ' + id, email: null, rank });
const token = (payload: object) => 'Bearer ' + sign({ exp: Date.now() + 60_000, ...payload });

function app(opts: { enabled?: boolean; accounts?: HostIdentity[]; lookupFails?: boolean; pingFails?: boolean } = {}) {
  const accounts = new Map((opts.accounts ?? []).map((a) => [a.id, a]));
  return createMozoraApp({
    enabled: () => opts.enabled ?? true,
    ping: async () => {
      if (opts.pingFails) throw new MozoraUnavailable('down');
    },
    lookup: async (id) => {
      if (opts.lookupFails) throw new MozoraUnavailable('down');
      return accounts.get(id) ?? null;
    },
  });
}

describe('feature flag', () => {
  it('answers 404 on every Mozora path when off', async () => {
    const off = app({ enabled: false, accounts: [account('staff_A', 'Owner')] });
    for (const path of ['/api/mozora/health', '/api/mozora/me', '/api/mozora/anything']) {
      const res = await request(off).get(path).set('Authorization', token({ uid: 'staff_A' }));
      expect(res.status, path).toBe(404);
    }
  });

  it('reads MOZORA_ENABLED as exactly "1"', async () => {
    const { mozoraEnabled } = await import('../config/flags.js');
    expect(mozoraEnabled({ MOZORA_ENABLED: '1' })).toBe(true);
    for (const v of ['0', 'true', 'yes', '', undefined]) expect(mozoraEnabled({ MOZORA_ENABLED: v })).toBe(false);
  });
});

describe('GET /api/mozora/health', () => {
  it('is public and reports the database', async () => {
    const res = await request(app()).get('/api/mozora/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'ok' });
  });

  it('fails closed when the database is down', async () => {
    const res = await request(app({ pingFails: true })).get('/api/mozora/health');
    expect(res.status).toBe(503);
    expect(res.body.database).toBe('unavailable');
  });
});

describe('GET /api/mozora/me', () => {
  const people = [account('staff_Boss', 'Owner'), account('google_1', 'User')];

  it('requires a token', async () => {
    expect((await request(app({ accounts: people })).get('/api/mozora/me')).status).toBe(401);
  });

  it('ignores a token in the query string', async () => {
    const t = sign({ uid: 'staff_Boss', exp: Date.now() + 60_000 });
    const res = await request(app({ accounts: people })).get('/api/mozora/me?token=' + encodeURIComponent(t));
    expect(res.status).toBe(401);
  });

  it('rejects forged, expired and legacy (uid-less) tokens', async () => {
    const a = app({ accounts: people });
    const good = sign({ uid: 'staff_Boss', exp: Date.now() + 60_000 });
    const forged = good.slice(0, -2) + (good.endsWith('AA') ? 'BB' : 'AA');
    for (const auth of [
      'Bearer ' + forged,
      token({ uid: 'staff_Boss', exp: Date.now() - 1 }),
      token({ user: { id: 'staff_Boss', rank: 'Owner' } }),
    ]) {
      expect((await request(a).get('/api/mozora/me').set('Authorization', auth)).status).toBe(401);
    }
  });

  it('never trusts a rank carried in the token', async () => {
    const res = await request(app({ accounts: people }))
      .get('/api/mozora/me')
      .set('Authorization', token({ uid: 'google_1', rank: 'Owner' }));
    expect(res.status).toBe(200);
    expect(res.body.capability).toBe('member');
  });

  it('treats an account missing from user_accounts as signed out', async () => {
    const res = await request(app({ accounts: people })).get('/api/mozora/me').set('Authorization', token({ uid: 'staff_Gone' }));
    expect(res.status).toBe(401);
  });

  it('returns the capability from the current rank', async () => {
    const res = await request(app({ accounts: people })).get('/api/mozora/me').set('Authorization', token({ uid: 'staff_Boss' }));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 'staff_Boss', name: 'Test staff_Boss', capability: 'fullAdmin' });
  });

  it('fails closed when the identity lookup is unavailable', async () => {
    const res = await request(app({ lookupFails: true })).get('/api/mozora/me').set('Authorization', token({ uid: 'staff_Boss' }));
    expect(res.status).toBe(503);
    expect(JSON.stringify(res.body)).not.toMatch(/staff_Boss/);
  });
});

describe('response hygiene', () => {
  it('sends a deny-all CSP and no-store on every response', async () => {
    for (const path of ['/api/mozora/health', '/api/mozora/nope']) {
      const res = await request(app()).get(path);
      expect(res.headers['content-security-policy']).toBe("default-src 'none'; frame-ancestors 'none'");
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.headers['x-powered-by']).toBeUndefined();
    }
  });
});
