// Prisma 7 configuration for Mozora. Prisma no longer loads .env files on its own, and connection
// URLs live here rather than in schema.prisma.
//
// MOZORA_DIRECT_URL is a direct (non-pooled) connection as `mozora_migrator`, used only by
// `prisma migrate deploy`: locally against the dev project, and in production only from the
// approved GitHub environment (D12). It must end in `?schema=mozora`: Prisma creates its
// `_prisma_migrations` bookkeeping table in that schema, and the migrator role cannot create anything
// in `public`, so a missing parameter fails loudly instead of touching the host.
//
// `prisma generate`, `validate` and `migrate diff` need no database. The placeholder deliberately has
// NO schema parameter: that makes `migrate diff` write fully qualified "mozora"."table" names, which
// scripts/check-migration-sql.mjs can verify.
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema.prisma',
  migrations: { path: './migrations' },
  datasource: {
    url: process.env.MOZORA_DIRECT_URL || 'postgresql://unset:unset@localhost:5432/unset',
  },
});
