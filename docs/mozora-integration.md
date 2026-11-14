# Mozora integration audit

Status: M0. This document re-checks section 2 of the build brief ("Host ground truth") against the
current code and against the live Vercel and Supabase configuration, and records what Mozora must do
because of it. It is kept current through the milestones.

## Sources

| Source | What was read | When |
|---|---|---|
| Host repository `DevTeamStudios-git/Mokza-Studios` | Branch `mozora/m0-foundation`, based on PR 0 (`13f92f4`); `main` is at `d83d007` | 2026-11-14 |
| Vercel project `mokzastudios` | Project settings, environment variable names and scopes (never values), latest deployments | 2026-11-14 |
| Supabase production project `pgxgfhqwzkdayhbyqfvl` | Table list, column definitions, RLS flags, policies, grants, role list, rank counts | 2026-11-14 |
| Supabase dev project `tmdbnqhlxdtupnufwymi` ("Mozora") | Created by the owner on 2026-11-14 for local, CI and Preview; empty at audit time | 2026-11-14 |

No row contents were read except aggregate counts. No secret values were read.

## 1. Section 2 re-verified

The brief audited commit `e9f9070`. Since then the host has changed in three commits:

| Commit | Change | Effect on Mozora |
|---|---|---|
| `c7ab9c5` (main) | Records the production RLS lockdown as `supabase-migrations/2026-11-12_lock_down_host_tables.sql` | Confirms S2 (see section 3) |
| `d83d007` (main) | Workspace hub sends the bearer token in the `Authorization` header instead of `?token=` | None; confirms the header-only token rule |
| `13f92f4` (PR 0) | `server/auth/{ranks,token,accounts,index}.js` extracted from `server/routes/api.js` | Mozora imports these; D1 done |

Every row of the section 2 table was re-checked. All hold, with these corrections:

| Area | Brief said | Actual |
|---|---|---|
| Layout | `server/auth/secret.js` only | `server/auth/` now also holds `ranks.js`, `token.js`, `accounts.js`, `index.js` (PR 0). 40 tracked files. `dist/` is not tracked. |
| Ranks | `RANK_LEVEL` not exported | Exported from `server/auth/ranks.js` and `server/auth/index.js` (PR 0). The client-side copies in `app.js` and `admin.js` remain and are cosmetic. |
| Database | `call_state` and `files` created outside the repo | They do not exist in production. The host routes that use them fall back to JSON files that do not persist on Vercel. See F2. |
| Database | Workspace tables not mentioned | `ws_admins`, `ws_documents`, `ws_rtdb` exist in production, empty, unused by any code. See F3. |
| Domains | `mokza-studios.com` declared in `index.html` | Not attached to the Vercel project. Production answers on `developpement-team.vercel.app` (plus two `*.vercel.app` aliases). See F5. |

## 2. Vercel configuration (confirmed)

| Setting | Value | Consequence |
|---|---|---|
| Framework preset | none (`null`) | Build and output come from `package.json` and `vercel.json`. |
| Node version | 24.x | Mozora targets Node 24 in CI to match. `engines` in `package.json` still says `>=18`. |
| Function region | `iad1` (US East) | The Mozora dev database is in `us-west-2`; production database is `us-east-2`. Fine for dev; production latency is unaffected. |
| Git integration | Connected; every pushed branch gets a preview deployment | Previews per PR work (seen for PR 0). |
| Deployment protection | Vercel Authentication on all deployments except custom domains | Playwright against a preview needs a Protection Bypass for Automation secret (spike S-D). |
| Environment variables | All 30 are scoped to Production only. Preview and Development have none. | Previews run with no `AUTH_SECRET` and no database: sign-in returns 503. See F1. |

Production variable names present (values not read): `AUTH_SECRET`, `STAFF_ACCOUNTS`,
`STAFF_SECURITY_CODE_HASH`, `STAFF_ACCOUNTS_OFORMAT`, `GOOGLE_*`, `DISCORD_*`, `ADMIN_API_TOKEN`,
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_PROJECT_REF`, `DATABASE_PASSWORD`, the Supabase Vercel integration set (`POSTGRES_*`,
`SUPABASE_JWT_SECRET`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_*`), and `MOZORA_DB_PASS`
(added 2026-11-14, see F6).

## 3. Supabase production (confirmed)

**S2 is resolved for host tables.** All ten host tables have RLS enabled, zero policies, and no
SELECT grant for `anon` or `authenticated`. The legacy JWT keys are disabled (done 2026-11-12/13).

**`user_accounts` shape:**

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | text | no | none |
| `email` | text | yes | none |
| `name` | text | yes | none |
| `picture` | text | yes | none |
| `provider` | text | no | none |
| `rank` | text | no | `'User'` |
| `created_at` | timestamptz | no | `now()` |
| `last_login_at` | timestamptz | no | `now()` |

Rank counts: CoOwner 1, Developer 2, User 1, Owner 0. Staff password accounts get a row only after
their first sign-in, so the Owner account has not signed in with the database-backed login yet. The
two Developer rows are Google accounts auto-promoted before the User tier existed; the owner should
review them (open item from the security pass).

**Roles:** no `mozora` schema and no `mozora_app` or `mozora_migrator` role exist yet. Supabase's
`postgres` role is not a superuser and has `BYPASSRLS`. `devtbot_app` (the Discord bot) exists with
its own schema, which is the precedent for D12.

## 4. Findings

**F1. Previews have no configuration (blocks D9 and spike S-A).** Preview deployments need their own
variables, pointed at the dev project, never at production: `AUTH_SECRET` (a different value from
production), `STAFF_ACCOUNTS` with test accounts only, `SUPABASE_URL` and a server key for the dev
project, `MOZORA_ENABLED`, `MOZORA_DATABASE_URL`. Until then nothing can sign in on a preview.

**F2. `files` and `call_state` do not persist in production (host bug, pre-existing).** The host
API queries both tables; neither exists, so it falls back to `server/data/*.json`, which is
read-only on Vercel. Uploads and call state are lost. Not Mozora's to fix (section 4 forbids host
changes beyond the allowed list); reported to the owner.

**F3. Orphan workspace tables accept Supabase Auth sessions.** `ws_admins`, `ws_documents` and
`ws_rtdb` are empty and referenced by no code, but carry policies for the `authenticated` role and
grants to `anon`. If Supabase Auth sign-up is enabled on the production project, anyone can create an
account with the publishable key and write rows into `ws_rtdb` and `ws_documents`. Recommended: drop
the three tables (the workspace plan replaces them anyway). Needs owner approval because it is a
production change.

**F4. Trainer mapping collapses into full-admin.** The owner decided Trainers are CoOwner and Owner
only. `roleMap` therefore has an empty `trainer.hostRoles` and every Trainer is a full-admin with
access to all cohorts. The "assigned cohorts" restriction and the trainer rows of the permission
matrix stay in the code (so Developer can be added later by editing one array) but have no user today.

**F5. Canonical domain.** OAuth redirect URIs and `safeReturn` work on `developpement-team.vercel.app`.
The native sign-in return path (spike S-E) and Android App Links need a stable HTTPS domain; that
choice is open question 7.

**F6. `MOZORA_DB_PASS` on Production.** Added by the owner on 2026-11-14 and scoped to Production.
The brief names the runtime variable `MOZORA_DATABASE_URL` (pooled, role `mozora_app`) and keeps the
dev project out of Production. Its purpose needs confirming before anything reads it.

**F7. Approver deadlock on staff attempts.** NO-EXEMPTION rule 3 requires a second approver who is a
full-admin different from both the author and the subject. With two full-admins (CoOwner and Owner),
any change one makes to the other's attempt has no eligible approver and stays blocked forever. The
code will implement the rule as written (queue and block); the owner must decide before M5 whether to
add a third full-admin, allow a documented break-glass path, or accept the block.

## 5. Mozora's host-touching changes (planned)

Exactly the brief's allowed list (section 4). Each lands as its own `host:` commit:

| # | File | Change | Milestone |
|---|---|---|---|
| 1 | `server/auth/*`, `server/routes/api.js` | Extraction | PR 0 (done) |
| 2 | `vercel.json` | `/api/mozora/(.*)` rewrite before the catch-all | M0 |
| 3 | `vite.config.js` | `mozora` input and the React plugin | M0 |
| 4 | `package.json`, lockfile | Dependencies and scripts | M0 |
| 5 | `public/js/app.js` | One nav link when the flag is on | M1 |
| 6 | `public/js/admin.js` | One Admin Panel entry | M1 |
| 7 | `.env.example` | Placeholder names only | M0 |
| 8 | `public/.well-known/assetlinks.json` | Android App Links | M10 |

## 6. Identity rules carried into code

- `userId` is `user_accounts.id` as TEXT. No foreign key to host tables.
- Display name from `user_accounts.name`; avatars are initials; `picture` is ignored.
- Rank is always read from `user_accounts` through `server/auth`, never from a token or a profile.
- `User` is never treated as enrolled. Membership exists only as `CohortMember` rows.
- Members include people under 18 (owner, 2026-11-13). Consent, SOI handling and Law 25 obligations
  for minors apply; see `docs/mozora-decisions.md` and open question 14.
