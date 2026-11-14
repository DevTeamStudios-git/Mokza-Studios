// Route registration (brief section 7). Mozora code never calls router.get/post directly: every route
// goes through this registry and declares its policy action, and the policy check runs before the
// handler. The manifest test walks `records` and fails on any route without a known action.
import type { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import type { HostIdentity } from '../db.js';
import { can, isKnownAction, type Action, type Subject } from '../policy/can.js';

export type RouteRecord = { method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; path: string; action: string };

export type Caller = { subject: Subject; account: HostIdentity | null };

export type CallerResolver = (req: Request) => Promise<Caller>;

// Set by the guard before every handler runs, so handlers never resolve the caller a second time.
export type MozoraLocals = Caller;

export function createRegistry(router: Router, resolveCaller: CallerResolver) {
  const records: RouteRecord[] = [];

  function add(method: RouteRecord['method'], path: string, action: Action, handler: RequestHandler) {
    if (!isKnownAction(action)) throw new Error(`Route ${method} ${path} declares unknown action "${action}"`);
    records.push({ method, path, action });
    const guard = async (req: Request, res: Response, next: NextFunction) => {
      try {
        const caller = await resolveCaller(req);
        const decision = can(caller.subject, action);
        if (!decision.allow) {
          const status = decision.reason === 'sign_in_required' ? 401 : 403;
          return res.status(status).json({ error: decision.reason });
        }
        Object.assign(res.locals as MozoraLocals, caller);
        next();
      } catch (err) {
        next(err);
      }
    };
    const m = method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
    router[m](path, guard, handler);
  }

  return {
    records,
    get: (path: string, action: Action, handler: RequestHandler) => add('GET', path, action, handler),
    post: (path: string, action: Action, handler: RequestHandler) => add('POST', path, action, handler),
  };
}
