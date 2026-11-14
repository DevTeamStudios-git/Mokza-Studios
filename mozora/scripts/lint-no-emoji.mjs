// No-emoji lint (brief section 6, rule 1). Scans only what Mozora owns; host files are excluded on
// purpose (they contain emoji today and are not Mozora's to change).
//
//   node mozora/scripts/lint-no-emoji.mjs                 scan Mozora's paths
//   node mozora/scripts/lint-no-emoji.mjs --text "..."    check one string (PR title, commit message)
//   git log --format=%B base..head | node mozora/scripts/lint-no-emoji.mjs --stdin
//
// "Emoji" means a character with default emoji presentation, any pictograph forced to emoji style
// with U+FE0F, regional-indicator flags, and keycaps. Plain text symbols such as the copyright sign
// or arrows are allowed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F|[\u{1F1E6}-\u{1F1FF}]|\u20E3/u;

export function findEmoji(text) {
  const hits = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const m = line.match(EMOJI);
    if (m) hits.push({ line: i + 1, char: m[0], codepoint: 'U+' + m[0].codePointAt(0).toString(16).toUpperCase() });
  });
  return hits;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCAN = ['mozora', 'server/mozora', 'api/mozora.ts', '.github'];
const SKIP_DIRS = new Set(['node_modules', 'generated', 'test-results', 'playwright-report', 'dist']);
const TEXT_EXT = /\.(ts|tsx|js|mjs|cjs|json|md|sql|prisma|css|html|ya?ml|txt)$/i;

function walk(rel, out) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return out;
  const stat = fs.statSync(full);
  if (stat.isFile()) {
    if (TEXT_EXT.test(rel) || path.basename(rel) === 'CODEOWNERS') out.push(rel);
    return out;
  }
  for (const entry of fs.readdirSync(full)) {
    if (SKIP_DIRS.has(entry)) continue;
    walk(path.join(rel, entry), out);
  }
  return out;
}

export function mozoraFiles() {
  const docs = fs.existsSync(path.join(ROOT, 'docs'))
    ? fs.readdirSync(path.join(ROOT, 'docs')).filter((f) => f.startsWith('mozora-')).map((f) => path.join('docs', f))
    : [];
  return [...SCAN.flatMap((p) => walk(p, [])), ...docs];
}

function report(label, hits) {
  for (const h of hits) console.error(`${label}:${h.line}  emoji ${h.codepoint} is not allowed in Mozora`);
}

function main() {
  const args = process.argv.slice(2);
  let failed = 0;
  if (args[0] === '--text') {
    const hits = findEmoji(args.slice(1).join(' '));
    report('text', hits);
    failed = hits.length;
  } else if (args[0] === '--stdin') {
    const hits = findEmoji(fs.readFileSync(0, 'utf8'));
    report('stdin', hits);
    failed = hits.length;
  } else {
    const files = mozoraFiles();
    for (const rel of files) {
      const hits = findEmoji(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
      report(rel.split(path.sep).join('/'), hits);
      failed += hits.length;
    }
    if (!failed) console.log(`no-emoji: ${files.length} Mozora files clean`);
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
