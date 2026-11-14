// Route manifest and source-rule tests (brief sections 4 and 7).
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createMozoraApp } from '../app.js';
import type { RouteRecord } from '../http/routes.js';
import { isKnownAction } from '../policy/can.js';

const ROOT = path.resolve(__dirname, '../../..');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__' && entry.name !== 'generated' && entry.name !== 'node_modules') out.push(...sourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const mozoraSources = [
  ...sourceFiles(path.join(ROOT, 'server/mozora')),
  path.join(ROOT, 'api/mozora.ts'),
  ...(fs.existsSync(path.join(ROOT, 'mozora/web')) ? sourceFiles(path.join(ROOT, 'mozora/web')) : []),
];
const rel = (f: string) => path.relative(ROOT, f).split(path.sep).join('/');

describe('route manifest', () => {
  const routes = (createMozoraApp({ enabled: () => true }).locals as { routes: RouteRecord[] }).routes;

  it('registers routes', () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it('every route declares a known policy action', () => {
    for (const r of routes) expect(isKnownAction(r.action), `${r.method} ${r.path} -> ${r.action}`).toBe(true);
  });

  it('no Mozora file registers a route outside the registry', () => {
    const offenders = mozoraSources
      .filter((f) => !rel(f).endsWith('server/mozora/http/routes.ts'))
      .filter((f) => /\b(router|app)\.(get|post|put|patch|delete|all)\s*\(/.test(fs.readFileSync(f, 'utf8')));
    expect(offenders.map(rel)).toEqual([]);
  });
});

describe('host rank names', () => {
  it('appear as string literals only in roleMap.ts', () => {
    const literal = /(['"`])(Owner|CoOwner|Developer|Apprentice|User)\1/;
    const offenders = mozoraSources
      .filter((f) => !rel(f).endsWith('server/mozora/config/roleMap.ts'))
      .filter((f) => literal.test(fs.readFileSync(f, 'utf8')));
    expect(offenders.map(rel)).toEqual([]);
  });
});
