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

// Both readers must strip a MATCHED pair of surrounding quotes. `docker run
// --env-file` is not a shell parser, so a quoted value in .env arrives with its
// quotes attached; without this the deploy dies on `new URL()` several steps
// later, after the CA has printed successfully, and reads as a TLS fault
// (2026-08-25, Alexandria). The backreference matters -- a one-sided quote must
// NOT be stripped, or a password containing one gets mangled.
for (const [name, source] of [
  ['scripts/prisma-migrate-deploy.mjs', migrateWrapper],
  ['prisma.config.ts', prismaConfig],
]) {
  assert.match(
    source,
    /MIGRATION_DATABASE_URL\?\.trim\(\)\.replace\(\s*\/\^\(\["'\]\)\(\.\*\)\\1\$\//,
    `${name} must strip matched surrounding quotes from MIGRATION_DATABASE_URL`,
  )
}

// SECRETS AND CREDENTIALS NEVER LIVE ON /mnt/user/pc (Silas, 2026-08-25). It is a
// general-access share and a primary thoroughfare for ordinary folders, which makes
// it the wrong home for a mode-600 file. The agent lane was moved off it on
// 2026-08-21; the migrate lane's handoff file was meant to follow and did not
// survive, which is what broke the 2026-08-25 production migration. Bulk non-secret
// data (kindrobots/images, kindrobots/animate, ai/models) legitimately lives there
// and is not what this checks.
for (const provisioner of [
  'scripts/provision-migrate-db-lane.sh',
  'scripts/provision-agent-db-lane.sh',
]) {
  const text = readFileSync(provisioner, 'utf8')
  assert.match(
    text,
    /SECRETS_DIR="\$\{SECRETS_DIR:-\$REPO_ROOT\/\.secrets\}"/,
    `${provisioner} must default SECRETS_DIR to <repo>/.secrets`,
  )
  const offending = text
    .split('\n')
    .filter((line) => /\/mnt\/user\/pc/.test(line) && !line.trim().startsWith('#'))
  assert.deepEqual(
    offending,
    [],
    `${provisioner} must not reference /mnt/user/pc outside a comment`,
  )
}

assert.match(
  runbook,
  /never on `\/mnt\/user\/pc`/,
  'the runbook must state where secrets live and where they must not',
)

// .env.example must NOT define MIGRATION_DATABASE_URL. Neither deploy path reads
// it from there -- compose's one-shot migrate service takes it from the shell and
// fails loudly when unset, and Alexandria's docker run passes it with -e from the
// .secrets handoff file. Defining it in .env does two bad things at once: the app
// service uses `env_file: .env`, so a permanently-running web process ends up
// holding a credential that can drop tables (see verifyMigrateOnDeploy.ts), and it
// becomes a SILENT FALLBACK that turns a lost handoff file into an obscure
// downstream error instead of a clear one (2026-08-25).
const envExample = readFileSync('.env.example', 'utf8')
const definesMigrationUrl = envExample
  .split('\n')
  .filter((line) => /^\s*(export\s+)?MIGRATION_DATABASE_URL\s*=/.test(line))
assert.deepEqual(
  definesMigrationUrl,
  [],
  '.env.example must not define MIGRATION_DATABASE_URL -- it belongs in ' +
    '<checkout>/.secrets/kindrobots-db-migrate.env and reaches deploys via the shell',
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
