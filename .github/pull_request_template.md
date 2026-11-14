## Milestone

<!-- PR 0, M0, M1, ... and one sentence on what this PR delivers. -->

## Host-touching commits

<!-- Every commit that changes a host file, prefixed `host:`, each from the allowed list in
     docs/mozora-integration.md section 5. Write "None" if there are none. -->

## Test evidence

- [ ] `npm run mozora:test`
- [ ] `npm run mozora:typecheck`
- [ ] `npm run mozora:lint`
- [ ] `npm run mozora:migrations:check`
- [ ] Playwright with `MOZORA_ENABLED=0` and `=1`
- [ ] D12 safety checks against the dev project (if `mozora/db` or `mozora/prisma` changed)

## Screenshots

<!-- Playwright screenshots of this milestone's flows: light and dark, French and English. -->

## Database

- [ ] No migration, or every migration stays inside schema `mozora` (CI guard passes)
- [ ] No `prisma migrate dev`, `migrate reset` or `db push` was run against the shared database

## Open questions raised

<!-- New questions for the owner, also added to docs/mozora-decisions.md. -->
