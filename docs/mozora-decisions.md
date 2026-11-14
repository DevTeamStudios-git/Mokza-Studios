# Mozora decisions

Decisions D1 to D12 from the build brief, with the owner's answers and the outcome of each M0 spike.
Kept current through the milestones. Facts about the live configuration are in
`docs/mozora-integration.md`.

## Owner answers (2026-11-13 and 2026-11-14)

| Question (brief section 18) | Answer |
|---|---|
| 1. Trainer mapping (D8) | Trainers are CoOwner and Owner only. Developer and Apprentice are members. |
| 2. Are members under 18? | Yes, some members are minors. |
| 3. Host auth extraction (D1) | Approved. Done in PR 0. |
| 4. React + TypeScript (D3) | Approved. |
| 5. Read access to Vercel and Supabase | Granted through the connectors. Audit done. |
| 6. S2 lockdown and key rotation | Done on 2026-11-12/13: host tables locked down, legacy JWT keys disabled, secret keys rotated. |
| Dev project for local, CI and Preview (D9) | Created by the owner on 2026-11-14: "Mozora", ref `tmdbnqhlxdtupnufwymi`, us-west-2. |

## Decisions

| | Decision | Status | Outcome |
|---|---|---|---|
| D1 | Shared auth in `server/auth/` | Done | PR 0: byte-identical behaviour across 80 API calls. Mozora imports `verify` and `bearerToken`. |
| D2 | Mozora cookie session | Designed (S-B) | Endpoint and `MozoraSession` usage in M1. Table exists from M0. |
| D3 | Vite + React + TypeScript strict | Done | `/mozora/` entry; host build output unchanged. |
| D4 | Separate Vercel function `api/mozora.ts` | Spike S-A | See below. |
| D5 | Prisma 7 in plain Node, schema `mozora` | Done | `prisma-client` generator (ESM, `.js` imports), `@prisma/adapter-pg`, `prisma.config.ts`. |
| D6 | Polling first; Realtime later | Decided (S-C) | Phase 2 is feasible through a custom OIDC issuer; not before a stable domain. |
| D7 | Derived quiz lifecycle | Unchanged | Applies from M3. |
| D8 | roleMap | Done | `trainer.hostRoles` is empty by owner decision. See F4 and F7. |
| D9 | Environments | Partly done | Dev project exists with roles. Preview has no variables yet (F1). |
| D10 | Electron and Android location | Open | Default `mozora/desktop/` and `mozora/android/`; owner to confirm before M9. |
| D11 | AI drafting | Out of scope | Unless the owner opts in. |
| D12 | Shared database rules | Done in dev (S-F) | Roles, grants, 26 SQL checks, 4 Data API checks, migration guard. Production not touched. |

## Spike results

### S-A: TypeScript function with Prisma on a Vercel preview

Question: does `api/mozora.ts`, importing TypeScript from `server/mozora/**` and the generated Prisma
client, build and run on Vercel?

Findings so far:
- Prisma 7 generates TypeScript source, not a package in `node_modules`. Its default `.ts` import
  specifiers do not run on plain Node; the generator is set to `moduleFormat = "esm"` and
  `importFileExtension = "js"`.
- `postinstall` runs `prisma generate`, so the client exists on every install, including Vercel's.
- The function needs no database to start; with the flag off it answers 404 from Mozora's own app
  (recognisable by its deny-all CSP header).

Result on the preview of `mozora/m0-foundation` (`01458f8`, 2026-11-14): **passes**.
- `/api/mozora/health` is answered by Mozora's own function: 404 `{"error":"not_found"}` with the
  deny-all CSP, `X-Frame-Options: DENY` and `no-store`, which only Mozora sends. The function module
  imports the generated Prisma client and the pg adapter at load time, so both load on Vercel's
  runtime.
- `/api/health` is still answered by the host function with its usual headers.
- `/mozora/` is served from the build with its CSP meta tag (Vercel serves `dist/`).

Still open: a real query through the pooled connection as `mozora_app`, which needs Preview
variables and the role logins (F1).

### S-B: Cookie session exchange (D2)

Design, implemented in M1:
- `POST /api/mozora/session` takes the host bearer token once, verifies it with the shared module,
  reads the current rank, creates a `mozora_session` row and sets `__Host-mozora_session`
  (HttpOnly, Secure, SameSite=Lax, Path=/, no Domain). The `__Host-` prefix pins the cookie to the
  exact origin.
- Every later Mozora request authenticates by that cookie, not the host token. The session row is
  checked for revocation, idle timeout (admin 20 min, member 60 min) and absolute timeout (8 h and
  12 h). The quiz autosave heartbeat counts as activity.
- Cookie authentication needs CSRF protection: state-changing requests must carry a custom header
  and pass an `Origin` check against the canonical origin. SameSite=Lax alone is not relied on.
- Limit that remains: the host token lives in localStorage, so an XSS on any host page can still
  start a Mozora session. The Mozora CSP protects Mozora's own pages, not the host's (S3).

### S-C: Realtime authorization (D6)

The shared-secret approach in the brief is no longer available: the production project's legacy JWT
secret was disabled during the security pass. Supabase now trusts third-party tokens through a
"Custom OIDC provider": the issuer signs with asymmetric keys, includes a `kid`, and publishes an
OIDC discovery document. Mozora could be that issuer (discovery and JWKS under a stable HTTPS URL,
short-lived tokens whose subject is the host account id), and Realtime and RLS would then see those
users.

Decision: phase 1 polling (5 s, ETag) as planned. Phase 2 only after the canonical domain is fixed
(open question 7), because the issuer URL must never change. Key rotation propagates within about
30 minutes on Supabase's side.

### S-D: Playwright against a preview URL

The suite runs locally and in CI against servers it starts itself (flag off and on, desktop and
mobile, axe in both themes and languages: 24 checks pass). Against a preview, Vercel Authentication
blocks automated requests. The config already sends `x-vercel-protection-bypass` when
`VERCEL_AUTOMATION_BYPASS_SECRET` is set; the owner creates that secret under Vercel > Settings >
Deployment Protection > Protection Bypass for Automation, and stores it as a GitHub secret.

### S-E: Android and Electron sign-in return path

Constraint: the host's `safeReturn` only accepts same-origin paths, and OAuth redirect URIs are fixed
per provider. The host token must never travel in a URL to a native app.

Design:
1. The app generates a PKCE verifier and challenge and opens the system browser (never a WebView) on
   `/mozora/app-signin?challenge=...`.
2. That page sends the user through normal host sign-in with `return=/mozora/app-callback`.
3. `/mozora/app-callback` (same origin) reads the host token from localStorage, calls
   `POST /api/mozora/native/handoff` with it and the challenge, and receives a one-time code that
   expires in 60 seconds.
4. The page redirects to the app: Android through a verified App Link
   (`https://<canonical-domain>/mozora/app-return?code=...` plus `public/.well-known/assetlinks.json`),
   Electron through a loopback redirect `http://127.0.0.1:<port>/callback?code=...` (RFC 8252).
5. The app exchanges code plus verifier at `POST /api/mozora/native/token` for a Mozora session token.

Needs the canonical domain (open question 7) before M10.

### S-F: Shared-database safety (D12)

Done against the dev project; production untouched.

- `mozora/db/10-roles-and-schema.sql`: idempotent roles, schema owned by `mozora_migrator`, default
  privileges, a four-column grant and a `mozora_app`-only SELECT policy on `public.user_accounts`.
  Supabase's `postgres` is not a superuser and cannot even name SUPERUSER in ALTER ROLE, so the
  script asserts role attributes instead of setting them.
- `mozora/db/tests/d12-safety.sql`: 26 checks, all passing. The three escalation checks test role
  membership, because `SET ROLE` inside a script is checked against the session user (postgres),
  which made the first version of those checks pass for the wrong reason.
- `mozora/db/tests/data-api-check.mjs`: the publishable key gets `PGRST106 Invalid schema: mozora`
  on read and write, and `42501` on the host identity table.
- `scripts/check-migration-sql.mjs`: allow-list guard. Prisma's raw output is rejected by design (it
  emits `CREATE SCHEMA` and no RLS); migrations are generated, then edited, then checked.
- Where Prisma keeps `_prisma_migrations`: `MOZORA_DIRECT_URL` must end in `?schema=mozora`. The
  migrator cannot create objects in `public`, so a wrong URL fails instead of touching the host.
  To be confirmed by the first `migrate deploy` against dev (needs the migrator login, F1).

## Open questions (current)

Blocking before M1 is merged:
- **F6.** What is `MOZORA_DB_PASS` (Production scope, added 2026-11-14)? Nothing reads it.
- **F1.** Preview variables against the dev project, and the two Mozora database logins.

Blocking before M5:
- **F7.** Approver deadlock with two full-admins: add a third full-admin, define a documented
  break-glass path, or accept that such changes stay blocked.

Blocking before launch:
- Members include minors: privacy owner, consent approach and privacy impact assessment under Quebec
  Law 25 (open question 14). Not legal advice; confirm with a qualified professional.
- **F3.** Drop the orphan `ws_*` tables in production.
- Canonical domain (open question 7): needed for S-C phase 2, S-E and App Links.

Non-blocking:
- **F2.** Host `files` and `call_state` tables missing in production (host bug, not Mozora's).
- Response headers for `/mozora/` (CSP `frame-ancestors`, HSTS) need a `headers` entry in
  `vercel.json`, which is not on the allowed host-change list. Today the page carries a CSP meta tag
  and the API sends full headers.
- Open questions 8 to 15 from the brief keep their defaults.
