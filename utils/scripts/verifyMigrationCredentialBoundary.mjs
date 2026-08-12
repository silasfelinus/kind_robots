import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const prismaConfig = readFileSync('prisma.config.ts', 'utf8')
const migrateWrapper = readFileSync('scripts/prisma-migrate-deploy.mjs', 'utf8')
const runbook = readFileSync('docs/runbooks/migration-credential-boundary.md', 'utf8')

assert.match(prismaConfig, /process\.argv\.slice\(2\)/)
assert.match(prismaConfig, /indexOf\('migrate'\)/)
assert.match(prismaConfig, /\['execute', 'push'\]/)
assert.match(
  prismaConfig,
  /MIGRATION_DATABASE_URL is required for Prisma migration\/schema-write commands/,
)
assert.match(prismaConfig, /url: migrationDatabaseUrl \|\| env\('DATABASE_URL'\)/)

assert.match(
  migrateWrapper,
  /const databaseUrl = process\.env\.MIGRATION_DATABASE_URL\?\.trim\(\)/,
)
assert.doesNotMatch(
  migrateWrapper,
  /MIGRATION_DATABASE_URL\s*\?\?\s*process\.env\.DATABASE_URL/,
)
assert.match(
  migrateWrapper,
  /DATABASE_URL is intentionally not accepted/,
)
assert.match(migrateWrapper, /MIGRATION_DATABASE_URL: url/)

assert.match(runbook, /prisma migrate deploy/)
assert.match(runbook, /prisma migrate resolve/)
assert.match(runbook, /prisma db execute/)
assert.match(runbook, /prisma db push/)
assert.match(runbook, /local development/i)

console.log('Migration credential boundary verified.')
