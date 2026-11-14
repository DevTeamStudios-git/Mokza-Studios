// Tests for Mozora's CI guard scripts. A guard that never fails is worse than none, so each one is
// checked against inputs it must reject.
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without type declarations
import { checkMigration } from './check-migration-sql.mjs';
// @ts-expect-error plain .mjs module without type declarations
import { compareDictionaries } from './check-i18n.mjs';
// @ts-expect-error plain .mjs module without type declarations
import { findEmoji } from './lint-no-emoji.mjs';

const VALID =
  'CREATE TABLE mozora.t (id int); ALTER TABLE mozora.t ENABLE ROW LEVEL SECURITY; ' +
  'CREATE POLICY "mozora_app only" ON mozora.t FOR ALL TO mozora_app USING (true) WITH CHECK (true);';

describe('check-migration-sql', () => {
  it('accepts a qualified table with RLS and the mozora_app policy', () => {
    expect(checkMigration(VALID)).toEqual([]);
  });

  it.each([
    ['unqualified table', 'CREATE TABLE "t" (id int)'],
    ['CREATE SCHEMA from prisma diff', 'CREATE SCHEMA IF NOT EXISTS "mozora"'],
    ['host table change', 'ALTER TABLE "public"."user_accounts" ADD COLUMN x int'],
    ['host table drop', 'DROP TABLE public.user_accounts'],
    ['role change', 'ALTER ROLE mozora_app BYPASSRLS'],
    ['grant to a browser role', 'GRANT SELECT ON mozora.t TO anon'],
    ['search_path change', 'SET search_path = public'],
    ['table without RLS', 'CREATE TABLE mozora.t (id int)'],
    ['table without policy', 'CREATE TABLE mozora.t (id int); ALTER TABLE mozora.t ENABLE ROW LEVEL SECURITY'],
    ['policy for anon', 'CREATE TABLE mozora.t (id int); ALTER TABLE mozora.t ENABLE ROW LEVEL SECURITY; CREATE POLICY p ON mozora.t FOR ALL TO anon USING (true)'],
    ['policy on a host table', VALID + ' CREATE POLICY x ON public.user_accounts FOR ALL TO mozora_app USING (true)'],
    ['schema name hidden in a quoted identifier', VALID + ' CREATE TABLE "mozora.x" (id int)'],
    ['security definer function', 'CREATE FUNCTION mozora.f() RETURNS int LANGUAGE sql SECURITY DEFINER AS $$ select 1 $$'],
    ['dynamic SQL in a DO block', VALID + " DO $$ BEGIN EXECUTE 'drop table x'; END $$"],
    ['truncate', 'TRUNCATE mozora.t'],
  ])('rejects %s', (_name, sql) => {
    expect(checkMigration(sql).length).toBeGreaterThan(0);
  });

  it('is not fooled by semicolons inside strings or dollar quotes', () => {
    expect(checkMigration(VALID + " COMMENT ON TABLE mozora.t IS 'a; DROP TABLE public.x'").length).toBeGreaterThan(0);
  });
});

describe('check-i18n', () => {
  it('passes matching dictionaries', () => {
    expect(compareDictionaries({ fr: { a: 'Salut {name}' }, en: { a: 'Hi {name}' } })).toEqual([]);
  });

  it('reports missing keys, empty values and placeholder drift', () => {
    const errors = compareDictionaries({
      fr: { a: 'Salut {name}', b: 'x', c: '' },
      en: { a: 'Hi {user}', c: 'ok' },
    });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('en: missing key "b"'),
        expect.stringContaining('fr: "c" must be a non-empty string'),
        expect.stringContaining('"a": placeholders differ'),
      ]),
    );
  });
});

describe('lint-no-emoji', () => {
  it.each([
    ['rocket', 'Ready \u{1F680}'],
    ['check mark emoji', 'Done \u2705'],
    ['text symbol forced to emoji style', 'Warning \u26A0\uFE0F'],
    ['flag', 'Quebec \u{1F1E8}\u{1F1E6}'],
    ['keycap', 'Step 1\uFE0F\u20E3'],
  ])('finds a %s', (_name, text) => {
    expect(findEmoji(text).length).toBe(1);
  });

  it('allows plain text symbols and French', () => {
    expect(findEmoji('Copyright \u00A9 2026, fleche \u2192, Ecole, eleve, a cote, \u00E9t\u00E9')).toEqual([]);
  });

  it('reports the line number', () => {
    expect(findEmoji('ok\nok\nbad \u{1F600}')[0].line).toBe(3);
  });
});
