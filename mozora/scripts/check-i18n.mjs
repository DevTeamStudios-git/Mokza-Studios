// i18n parity (brief section 6, rule 3): fr.json and en.json must have exactly the same keys, every
// value must be a non-empty string, and each key must use the same {placeholders} in both languages.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

export function compareDictionaries(dicts) {
  const errors = [];
  const langs = Object.keys(dicts);
  const allKeys = new Set(langs.flatMap((l) => Object.keys(dicts[l])));
  for (const key of [...allKeys].sort()) {
    for (const lang of langs) {
      const v = dicts[lang][key];
      if (v === undefined) errors.push(`${lang}: missing key "${key}"`);
      else if (typeof v !== 'string' || !v.trim()) errors.push(`${lang}: "${key}" must be a non-empty string`);
    }
    const shapes = new Set(langs.map((l) => (typeof dicts[l][key] === 'string' ? placeholders(dicts[l][key]) : '')));
    if (shapes.size > 1) errors.push(`"${key}": placeholders differ between ${langs.join(' and ')}`);
  }
  return errors;
}

function main() {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../i18n');
  const dicts = {
    fr: JSON.parse(fs.readFileSync(path.join(dir, 'fr.json'), 'utf8')),
    en: JSON.parse(fs.readFileSync(path.join(dir, 'en.json'), 'utf8')),
  };
  const errors = compareDictionaries(dicts);
  for (const e of errors) console.error('i18n: ' + e);
  if (!errors.length) console.log(`i18n: fr and en match (${Object.keys(dicts.fr).length} keys)`);
  process.exit(errors.length ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
