// Mozora's Vite plugins, imported by the host's vite.config.js in one line (host-touching change 3).
// Keeping them here means the host config only ever gains one input and this one import.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

const HOST_CSS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/style.css');
const TOKENS_ID = 'virtual:mozora-host-tokens.css';
const RESOLVED_TOKENS_ID = '\0' + TOKENS_ID;

// Top-level blocks of the host stylesheet that only define tokens. Everything else in style.css
// (body, navbar, admin panel...) is the host's and must not leak into Mozora.
const TOKEN_SELECTOR = /^(:root|\[data-theme="(?:light|dark)"\])$/;

export function extractHostTokens(css) {
  const out = [];
  const re = /(^|\n)([^\n{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const selector = m[2].trim();
    if (TOKEN_SELECTOR.test(selector) && /--[\w-]+\s*:/.test(m[3])) out.push(`${selector} {${m[3]}}`);
  }
  return out.join('\n');
}

// Serves the host's design tokens to Mozora as a separate virtual module, read from assets/style.css
// at build time (one source of truth, no copy to drift). Importing style.css itself would make it a
// chunk shared with the host's index.html, and Rollup would rename the host's CSS file.
function mozoraHostTokens() {
  return {
    name: 'mozora-host-tokens',
    resolveId(id) {
      return id === TOKENS_ID ? RESOLVED_TOKENS_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_TOKENS_ID) return null;
      this.addWatchFile(HOST_CSS);
      const tokens = extractHostTokens(fs.readFileSync(HOST_CSS, 'utf8'));
      if (!tokens.includes(':root')) this.error('mozora-host-tokens: no :root token block found in assets/style.css');
      return `/* Host design tokens, extracted from assets/style.css at build time. */\n${tokens}\n`;
    },
  };
}

// Production CSP for the /mozora/ page, injected at build time only: the dev server needs inline
// scripts for hot reload, which this policy forbids. frame-ancestors cannot be set from a <meta>
// tag; it needs a response header (open question in docs/mozora-decisions.md).
const MOZORA_CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

function mozoraCsp() {
  return {
    name: 'mozora-csp',
    apply: 'build',
    transformIndexHtml(html, ctx) {
      if (!ctx.filename.replace(/\\/g, '/').endsWith('/mozora/index.html')) return html;
      return html.replace(
        /<!-- MOZORA_CSP:[^>]*-->/,
        `<meta http-equiv="Content-Security-Policy" content="${MOZORA_CSP}">`,
      );
    },
  };
}

export function mozoraVitePlugins() {
  // React transform for Mozora's sources only; host pages are untouched.
  return [react({ include: /mozora[\\/]web[\\/].*\.tsx?$/ }), mozoraHostTokens(), mozoraCsp()];
}

export { MOZORA_CSP };
