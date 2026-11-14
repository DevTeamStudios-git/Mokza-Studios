// Migration SQL guard (brief D12). Mozora shares the host's production database, so every migration
// must stay inside schema `mozora`. Fails if any statement in mozora/prisma/migrations:
//   - references an object that is not qualified with the `mozora` schema
//   - touches roles, other schemas, extensions, or session settings
//   - creates a table without enabling RLS and adding the single "mozora_app only" policy
//
// Allow-by-construction: a statement must match one of the known-safe shapes below, otherwise it fails.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const Q = '"?mozora"?\\.';                 // schema qualifier, quoted or not
const ID = '(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_]*)'; // one identifier, quoted (may contain spaces) or bare

// Statement shapes allowed in a Mozora migration. Each must name `mozora.` explicitly.
const ALLOWED = [
  new RegExp(`^CREATE TABLE ${Q}${ID}\\s*\\(`, 'i'),
  new RegExp(`^ALTER TABLE ${Q}${ID}\\s+(ADD|DROP|ALTER|RENAME|ENABLE ROW LEVEL SECURITY|FORCE ROW LEVEL SECURITY)`, 'i'),
  new RegExp(`^DROP TABLE ${Q}${ID}$`, 'i'),
  new RegExp(`^CREATE (UNIQUE )?INDEX ${ID} ON ${Q}${ID}`, 'i'),
  new RegExp(`^DROP INDEX ${Q}${ID}$`, 'i'),
  new RegExp(`^ALTER INDEX ${Q}${ID} RENAME TO ${ID}$`, 'i'),
  new RegExp(`^CREATE TYPE ${Q}${ID} AS ENUM`, 'i'),
  new RegExp(`^ALTER TYPE ${Q}${ID} (ADD VALUE|RENAME)`, 'i'),
  new RegExp(`^DROP TYPE ${Q}${ID}$`, 'i'),
  new RegExp(`^CREATE POLICY ${ID} ON ${Q}${ID} (AS (PERMISSIVE|RESTRICTIVE) )?FOR (ALL|SELECT|INSERT|UPDATE|DELETE) TO "?mozora_app"? `, 'i'),
  new RegExp(`^DROP POLICY ${ID} ON ${Q}${ID}$`, 'i'),
  new RegExp(`^(GRANT|REVOKE) [A-Z, ]+ ON (TABLE )?${Q}${ID} (TO|FROM) "?mozora_app"?$`, 'i'),
];

// Never allowed, even if a pattern above would match by accident.
const FORBIDDEN = /\b(public|auth|storage|extensions|graphql|realtime|supabase_\w+|pg_catalog|devtbot)\s*"?\s*\.|\b(CREATE|ALTER|DROP) (ROLE|USER|SCHEMA|EXTENSION|DATABASE)\b|\bSET\s+(ROLE|SESSION|search_path)\b|\bSECURITY DEFINER\b|\bTRUNCATE\b|\bCOPY\b/i;

function stripComments(sql) {
  return sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

// Splits on semicolons outside single quotes, double quotes and dollar-quoted bodies.
export function splitStatements(sql) {
  const out = [];
  let cur = '';
  let i = 0;
  let quote = null;
  let dollar = null;
  while (i < sql.length) {
    const c = sql[i];
    if (dollar) {
      if (sql.startsWith(dollar, i)) { cur += dollar; i += dollar.length; dollar = null; continue; }
    } else if (quote) {
      if (c === quote) quote = null;
    } else if (c === "'" || c === '"') {
      quote = c;
    } else if (c === '$') {
      const m = sql.slice(i).match(/^\$[A-Za-z_]*\$/);
      if (m) { dollar = m[0]; cur += dollar; i += dollar.length; continue; }
    } else if (c === ';') {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
      i++;
      continue;
    }
    cur += c;
    i++;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function checkMigration(sql) {
  const errors = [];
  const statements = splitStatements(stripComments(sql)).map((s) => s.replace(/\s+/g, ' ').trim());
  const created = new Set();
  const rls = new Set();
  const policies = new Set();
  // Table named by the first `mozora.` qualifier; for CREATE POLICY, the one after ON.
  const tableOf = (s) => (s.match(new RegExp(`${Q}(${ID})`, 'i')) || [])[1]?.replace(/"/g, '');
  const policyTable = (s) => (s.match(new RegExp(` ON ${Q}(${ID})`, 'i')) || [])[1]?.replace(/"/g, '');
  for (const s of statements) {
    if (FORBIDDEN.test(s)) { errors.push(`forbidden: ${s.slice(0, 120)}`); continue; }
    if (!ALLOWED.some((re) => re.test(s))) { errors.push(`not an allowed Mozora statement: ${s.slice(0, 120)}`); continue; }
    if (/^CREATE TABLE/i.test(s)) created.add(tableOf(s));
    if (/ENABLE ROW LEVEL SECURITY/i.test(s)) rls.add(tableOf(s));
    if (/^CREATE POLICY/i.test(s)) policies.add(policyTable(s));
  }
  for (const t of created) {
    if (!rls.has(t)) errors.push(`table mozora.${t} is created without ENABLE ROW LEVEL SECURITY`);
    if (!policies.has(t)) errors.push(`table mozora.${t} is created without a policy for mozora_app`);
  }
  return errors;
}

function main() {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../prisma/migrations');
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(dir, d.name, 'migration.sql')).filter((f) => fs.existsSync(f))
    : [];
  let failed = 0;
  for (const f of files) {
    const errors = checkMigration(fs.readFileSync(f, 'utf8'));
    for (const e of errors) console.error(`${path.relative(process.cwd(), f)}: ${e}`);
    failed += errors.length;
  }
  if (!failed) console.log(`migrations: ${files.length} file(s) stay inside schema mozora`);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
