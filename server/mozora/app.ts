// The Mozora API (brief D4). Mounted at /api/mozora by api/mozora.ts on Vercel and by dev-server.ts
// locally. Shares nothing with the host's Express app except the auth modules it imports.
import express, { type NextFunction, type Request, type Response } from 'express';
import { mozoraEnabled } from './config/flags.js';
import { assertRoleMap } from './config/roleMap.js';
import { MozoraUnavailable, pingDatabase } from './db.js';
import { createRegistry, type MozoraLocals, type RouteRecord } from './http/routes.js';
import { resolveIdentity, type AccountLookup } from './identity.js';

export type MozoraDeps = {
  lookup?: AccountLookup;
  ping?: () => Promise<void>;
  enabled?: () => boolean;
};

// Strict CSP for everything Mozora serves (brief section 2: the host has none). The API returns JSON
// only, so it allows nothing at all.
function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  next();
}

export function createMozoraApp(deps: MozoraDeps = {}) {
  assertRoleMap();
  const enabled = deps.enabled ?? (() => mozoraEnabled());
  const ping = deps.ping ?? pingDatabase;

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(securityHeaders);

  // Flag off: Mozora does not exist. Same answer for every path, before any other work.
  app.use('/api/mozora', (_req, res, next) => (enabled() ? next() : res.status(404).json({ error: 'not_found' })));
  app.use(express.json({ limit: '256kb' }));

  const router = express.Router();
  const routes = createRegistry(router, (req) => resolveIdentity(req, deps.lookup));

  routes.get('/health', 'system.health', async (_req, res) => {
    try {
      await ping();
      res.json({ status: 'ok', database: 'ok' });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'unavailable' });
    }
  });

  routes.get('/me', 'self.read', (_req, res) => {
    const { subject, account } = res.locals as MozoraLocals;
    if (!account || !subject.signedIn) return res.status(401).json({ error: 'sign_in_required' });
    res.json({ userId: account.id, name: account.name, capability: subject.capability });
  });

  app.use('/api/mozora', router);
  app.use('/api/mozora', (_req, res) => res.status(404).json({ error: 'not_found' }));

  // Fail closed and never echo internals or member data in an error.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof MozoraUnavailable) return res.status(503).json({ error: 'unavailable' });
    console.error('[mozora] request failed:', err instanceof Error ? err.name : 'unknown');
    res.status(500).json({ error: 'internal' });
  });

  (app.locals as { routes: RouteRecord[] }).routes = routes.records;
  return app;
}
