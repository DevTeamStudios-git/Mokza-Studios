# Mozora setup guide

Step-by-step setup for the owner. Each step says where to click or what to run, what success looks
like, and what to do if something else appears. Sections are added milestone by milestone; this is
the M0 version.

Golden rules, for every step:
- Never paste a password or connection URL into a chat, an issue, a commit or `.env.example`.
- Paste secrets in the Vercel or GitHub dashboard, never through a shell command.
- Nothing in this guide touches the production database. Production steps come later and go through
  a reviewed job.

## 1. Run Mozora on your computer

Use `npm run ...` commands: npm always runs them from the project folder (the one that contains
`package.json`, `Mokza Studios Website`), wherever your terminal is, even inside `mozora`.

Once, after downloading or pulling changes:

```bash
npm install
```

Success: the last lines include `Generated Prisma Client`. If you see
`npm warn allow-scripts`, that is expected; nothing else is needed.

Then start two terminals.

Terminal 1, the website and its API (Vite on port 5173, host API on port 3001):

```bash
npm run dev
```

Terminal 2, the Mozora API (port 3002):

```bash
npm run mozora:api
```

Open `http://localhost:5173/mozora/`. With the flag off you see "Mozora n'est pas encore activé sur
ce site."

To see Mozora switched on, stop both terminals (Ctrl+C) and start them like this instead
(PowerShell):

```powershell
$env:MOZORA_ENABLED='1'; $env:VITE_MOZORA_ENABLED='1'; npm run dev
```

```powershell
$env:MOZORA_ENABLED='1'; npm run mozora:api
```

The page then says "Connectez-vous sur le site Mokza Studios pour accéder à Mozora." Signing in
locally needs the dev database logins from step 3.

Stop the servers (Ctrl+C) when you are done: Vite listens on your whole network (`host: true` in
`vite.config.js`), so do not leave it running on shared Wi-Fi.

If you run raw commands such as `node server/index.js` or `npx vite` yourself, run them from the
project folder (`cd "C:\Users\gabet\Mokza Studios Website"`). From the `mozora` subfolder they fail
with `Cannot find module ...\mozora\server\index.js` or `Failed to load url /mozora/web/main.tsx`.

## 2. Run the checks

```bash
npm run mozora:test
```

```bash
npm run mozora:typecheck
```

```bash
npm run mozora:lint
```

```bash
npm run mozora:migrations:check
```

Browser tests (the first run downloads Chromium, about 150 MB):

```bash
npx playwright install chromium
```

```bash
npm run mozora:e2e
```

Success for each: it ends with `passed` or `clean` and exits without errors. If Playwright says a
port is in use, stop the servers from step 1 first: the test starts its own.

## 3. Create the dev database logins

The dev project ("Mozora", `tmdbnqhlxdtupnufwymi`) already has the roles, the locked schema and the
host stub. It does not yet have passwords for the two roles.

```bash
node mozora/scripts/make-db-login.mjs --project-ref tmdbnqhlxdtupnufwymi
```

1. When asked, open supabase.com > the **Mozora** project > **Connect** (top bar) > **Connection
   string** > **Session pooler**, copy the string and paste it. It still contains `[YOUR-PASSWORD]`;
   that is fine.
2. The script prints two `alter role ... password 'SCRAM-SHA-256$...'` lines. Open the **Mozora**
   project > **SQL Editor**, paste both lines, and press **Run**. Success: "Success. No rows
   returned."
3. The two connection URLs are now in `mozora/.env.local` (git ignores it). Open that file only when
   you need to copy a value in the next steps.

If the script says the string belongs to another project, you copied it from the production project.
Switch projects in the Supabase dashboard and copy again.

## 4. Vercel: give Preview deployments their own settings

Today every Vercel variable is scoped to Production only, so previews cannot sign in. Previews must
use the dev project, never production.

vercel.com > **mokzastudios** > **Settings** > **Environment Variables** > **Add**. For each row,
untick **Production** and **Development**, keep only **Preview**:

| Name | Value |
|---|---|
| `MOZORA_ENABLED` | `1` |
| `VITE_MOZORA_ENABLED` | `1` |
| `MOZORA_DATABASE_URL` | the `MOZORA_DATABASE_URL` line from `mozora/.env.local` |
| `AUTH_SECRET` | a NEW value, different from production: `node scripts/hash-password.js --secret` |

Do not add `MOZORA_DIRECT_URL` to Vercel at all: migrations never run from Vercel.

Success: on the next preview deployment (any pull request branch),
`/api/mozora/health` answers `{"status":"ok","database":"ok"}`. Production is unaffected: it has
none of these variables, so Mozora stays switched off there.

## 5. GitHub: secrets for CI

github.com > **DevTeamStudios-git/Mokza-Studios** > **Settings** > **Secrets and variables** >
**Actions**.

Secrets (**New repository secret**):

| Name | Value |
|---|---|
| `MOZORA_DEV_DIRECT_URL` | the `MOZORA_DIRECT_URL` line from `mozora/.env.local` |
| `MOZORA_DEV_ADMIN_URL` | dev project > Connect > **Direct connection** string, with the dev project's database password |

Variables (**Variables** tab > **New repository variable**):

| Name | Value |
|---|---|
| `MOZORA_DEV_SUPABASE_URL` | `https://tmdbnqhlxdtupnufwymi.supabase.co` |
| `MOZORA_DEV_PUBLISHABLE_KEY` | dev project > **Project Settings** > **API Keys** > publishable key |

Success: on the next pull request, the "Shared-database safety" and "Data API" jobs run instead of
printing "skipping".

## 6. Optional: Playwright against previews

vercel.com > **mokzastudios** > **Settings** > **Deployment Protection** > **Protection Bypass for
Automation** > **Add**. Copy the generated value into a GitHub secret named
`VERCEL_AUTOMATION_BYPASS_SECRET`.

## 7. Writing a migration (for whoever builds M1 onward)

1. Edit `mozora/prisma/schema.prisma`. Every model gets `@@schema("mozora")`.
2. Generate the SQL by comparing the dev database (all earlier migrations applied) with the new
   schema. This only reads the dev database; set `MOZORA_DIRECT_URL` from `mozora/.env.local` first:
   `npx prisma migrate diff --config mozora/prisma/prisma.config.ts --from-config-datasource --to-schema mozora/prisma/schema.prisma --script`
   (Diffing the migrations folder instead needs a separate throwaway "shadow" database, which this
   project does not configure.)
3. Save it as `mozora/prisma/migrations/<timestamp>_<name>/migration.sql`, then edit it: delete any
   `CREATE SCHEMA` line, and for each new table add
   `ALTER TABLE "mozora"."<table>" ENABLE ROW LEVEL SECURITY;` and
   `CREATE POLICY "mozora_app only" ON "mozora"."<table>" FOR ALL TO "mozora_app" USING (true) WITH CHECK (true);`
4. `npm run mozora:migrations:check` must pass.
5. Apply to the dev project only: `npx prisma migrate deploy --config mozora/prisma/prisma.config.ts`
   with `MOZORA_DIRECT_URL` from `mozora/.env.local`.

Never run `prisma migrate dev`, `prisma migrate reset` or `prisma db push` against a database that
holds host tables. They can offer to reset it.
