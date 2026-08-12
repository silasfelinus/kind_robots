import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const provisionPath = new URL(
  '../../scripts/provision-vercel-db-isolation.sh',
  import.meta.url,
)
const provisionSource = readFileSync(provisionPath, 'utf8')
const migrateSource = readFileSync(
  new URL('../../scripts/prisma-migrate-deploy.mjs', import.meta.url),
  'utf8',
)

execFileSync('bash', ['-n', provisionPath.pathname], { stdio: 'inherit' })

assert.match(provisionSource, /MODE='dry-run'/)
assert.match(provisionSource, /--apply/)
assert.match(provisionSource, /PREVIEW_DB_USER="\$\{PREVIEW_DB_USER:-kindrobot_preview\}"/)
assert.match(
  provisionSource,
  /MIGRATION_DB_USER="\$\{MIGRATION_DB_USER:-kindrobot_migrate\}"/,
)
assert.match(provisionSource, /PREVIEW_HOSTGROUP="\$\{PREVIEW_HOSTGROUP:-20\}"/)
assert.match(
  provisionSource,
  /MIGRATION_HOSTGROUP="\$\{MIGRATION_HOSTGROUP:-30\}"/,
)
assert.match(provisionSource, /PREVIEW_FRONTEND_MAX="\$\{PREVIEW_FRONTEND_MAX:-40\}"/)
assert.match(
  provisionSource,
  /MIGRATION_FRONTEND_MAX="\$\{MIGRATION_FRONTEND_MAX:-8\}"/,
)
assert.match(provisionSource, /PREVIEW_BACKEND_MAX="\$\{PREVIEW_BACKEND_MAX:-8\}"/)
assert.match(
  provisionSource,
  /MIGRATION_BACKEND_MAX="\$\{MIGRATION_BACKEND_MAX:-4\}"/,
)
assert.match(
  provisionSource,
  /PROXYSQL_WAIT_TIMEOUT_MS="\$\{PROXYSQL_WAIT_TIMEOUT_MS:-600000\}"/,
)

assert.match(
  provisionSource,
  /GRANT SELECT, SHOW VIEW ON \\`\$\{DATABASE_NAME\}\\`\.\* TO '\$\{PREVIEW_DB_USER\}'@'%'/,
)
assert.match(
  provisionSource,
  /GRANT ALL PRIVILEGES ON \\`\$\{DATABASE_NAME\}\\`\.\* TO '\$\{MIGRATION_DB_USER\}'@'%'/,
)
assert.match(provisionSource, /MAX_USER_CONNECTIONS \$\{PREVIEW_BACKEND_MAX\}/)
assert.match(provisionSource, /MAX_USER_CONNECTIONS \$\{MIGRATION_BACKEND_MAX\}/)
assert.match(provisionSource, /MYSQL_NATIVE_PASSWORD\('\$\{PREVIEW_DB_PASSWORD\}'\)/)
assert.match(
  provisionSource,
  /MYSQL_NATIVE_PASSWORD\('\$\{MIGRATION_DB_PASSWORD\}'\)/,
)
assert.match(provisionSource, /generic ProxySQL query rule/)
assert.match(provisionSource, /MARIADB_CONNECTION_RESERVE/)
assert.match(provisionSource, /LOAD MYSQL SERVERS TO RUNTIME/)
assert.match(provisionSource, /SAVE MYSQL SERVERS TO DISK/)
assert.match(provisionSource, /LOAD MYSQL USERS TO RUNTIME/)
assert.match(provisionSource, /SAVE MYSQL USERS TO DISK/)
assert.match(provisionSource, /LOAD MYSQL VARIABLES TO RUNTIME/)
assert.match(provisionSource, /SAVE MYSQL VARIABLES TO DISK/)
assert.match(provisionSource, /Passwords and URLs are intentionally not printed/)
assert.match(provisionSource, /chmod 600 "\$OUTPUT_FILE"/)
assert.match(provisionSource, /VERCEL_PREVIEW_DATABASE_URL=/)
assert.match(provisionSource, /VERCEL_PRODUCTION_MIGRATION_DATABASE_URL=/)

assert.doesNotMatch(provisionSource, /DROP\s+DATABASE/i)
assert.doesNotMatch(provisionSource, /DROP\s+USER/i)
assert.doesNotMatch(provisionSource, /TRUNCATE\s+TABLE/i)
assert.doesNotMatch(provisionSource, /prisma\s+migrate\s+reset/i)

assert.match(
  migrateSource,
  /const databaseUrl = process\.env\.MIGRATION_DATABASE_URL\?\.trim\(\)/,
)
assert.doesNotMatch(
  migrateSource,
  /process\.env\.MIGRATION_DATABASE_URL\s*\?\?\s*process\.env\.DATABASE_URL/,
)
assert.match(
  migrateSource,
  /MIGRATION_DATABASE_URL is required for migration execution; DATABASE_URL is intentionally not accepted/,
)

console.log('Vercel database isolation provisioning contract passed.')
