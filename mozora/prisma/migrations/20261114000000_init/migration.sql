-- Mozora initial migration (M0).
--
-- Generated with `prisma migrate diff --from-empty`, then edited by hand, as every Mozora migration is:
--   - the CREATE SCHEMA line Prisma emits is removed: schema `mozora` and its grants are created once
--     by mozora/db/10-roles-and-schema.sql, which is reviewed separately
--   - each new table gets RLS plus the single policy that lets only mozora_app through (D6, D12)
-- scripts/check-migration-sql.mjs rejects the file if either edit is missing.

-- CreateTable
CREATE TABLE "mozora"."mozora_session" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stepUpAt" TIMESTAMPTZ(6),
    "revokedAt" TIMESTAMPTZ(6),
    "userAgentHash" TEXT,

    CONSTRAINT "mozora_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mozora_session_userId_createdAt_idx" ON "mozora"."mozora_session"("userId", "createdAt");

-- Row level security: deny by default; mozora_app is the only role with a policy.
ALTER TABLE "mozora"."mozora_session" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mozora_app only" ON "mozora"."mozora_session" FOR ALL TO "mozora_app" USING (true) WITH CHECK (true);
