import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

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
// it the wrong home for a mode-600 file. Check every credential provisioner that is
// still present; the retired agent-lane provisioner was removed with that lane.
for (const provisioner of [
  'scripts/provision-migrate-db-lane.sh',
  'scripts/provision-agent-db-lane.sh',
].filter(existsSync)) {
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
// The boundary must check the ACCOUNT, not only the variable name. Refusing
// DATABASE_URL as a variable does nothing about MIGRATION_DATABASE_URL holding the
// app account's URL -- which is what production actually had on 2026-08-25 (.env
// line 103 pointed at `kindrobot`, not `kindrobot_migrate`), passing every check in
// this repo because every check looked at the name.
assert.match(
  migrateWrapper,
  /MIGRATION_DATABASE_URL and DATABASE_URL are the same database account/,
  'prisma-migrate-deploy.mjs must refuse a MIGRATION_DATABASE_URL whose account ' +
    'equals DATABASE_URL\'s -- name-only checks do not enforce the lane boundary',
)
assert.match(
  migrateWrapper,
  /new URL\(databaseUrl\)\.username/,
  'the account check must compare parsed usernames, not substrings',
)

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