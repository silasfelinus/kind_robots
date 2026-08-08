import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const scriptUrl = new URL('../../scripts/provision-agent-db-lane.sh', import.meta.url)
const tuningUrl = new URL('../../scripts/tune-agent-database-url.sh', import.meta.url)
const source = readFileSync(scriptUrl, 'utf8')
const tuningSource = readFileSync(tuningUrl, 'utf8')

execFileSync('bash', ['-n', scriptUrl.pathname], { stdio: 'inherit' })
execFileSync('bash', ['-n', tuningUrl.pathname], { stdio: 'inherit' })

assert.match(source, /MODE='dry-run'/)
assert.match(source, /AGENT_DB_USER="\$\{AGENT_DB_USER:-kindrobot_agent\}"/)
assert.match(source, /AGENT_HOSTGROUP="\$\{AGENT_HOSTGROUP:-40\}"/)
assert.match(source, /AGENT_FRONTEND_MAX="\$\{AGENT_FRONTEND_MAX:-20\}"/)
assert.match(source, /AGENT_BACKEND_MAX="\$\{AGENT_BACKEND_MAX:-6\}"/)
assert.match(source, /APP_DB_USER="\$\{APP_DB_USER:-kindrobot\}"/)
assert.match(source, /Agent hostgroup must differ from production/)

assert.match(
  source,
  /GRANT SELECT, INSERT, UPDATE, DELETE, SHOW VIEW ON \\`\$\{DATABASE_NAME\}\\`\.\* TO '\$\{AGENT_DB_USER\}'@'%';/,
)
assert.match(source, /REVOKE ALL PRIVILEGES, GRANT OPTION FROM '\$\{AGENT_DB_USER\}'@'%';/)
assert.match(source, /WITH MAX_USER_CONNECTIONS \$\{AGENT_BACKEND_MAX\}/)
assert.doesNotMatch(source, /GRANT ALL PRIVILEGES ON/)
assert.doesNotMatch(source, /^MIGRATION_DATABASE_URL=/m)
assert.doesNotMatch(source, /DROP\s+DATABASE/i)
assert.doesNotMatch(source, /prisma\s+migrate\s+reset/i)

assert.match(source, /current_backend_max=.*SUM\(max_connections\)/)
assert.match(source, /planned_backend_max=\$\(\(current_backend_max - existing_agent_backend_max \+ planned_agent_backend_max\)\)/)
assert.match(source, /MARIADB_CONNECTION_RESERVE="\$\{MARIADB_CONNECTION_RESERVE:-30\}"/)
assert.match(source, /planned_backend_max.*backend_budget/)
assert.match(source, /generic ProxySQL query rule/)
assert.match(source, /backend rows unrelated to production hostgroup/)

assert.match(source, /default_hostgroup=\$\{AGENT_HOSTGROUP\}/)
assert.match(source, /schema_locked=1/)
assert.match(source, /transaction_persistent=1/)
assert.match(source, /max_connections=\$\{AGENT_FRONTEND_MAX\}/)
assert.match(source, /Kind Robots coding-agent lane/)
assert.match(source, /Agent authentication through ProxySQL failed/)

assert.match(source, /dangerous_privileges=/)
assert.match(source, /'ALTER','ALTER ROUTINE','CREATE','CREATE ROUTINE','CREATE TEMPORARY TABLES'/)
assert.match(source, /'CREATE VIEW','DROP','EVENT','EXECUTE','INDEX','REFERENCES','TRIGGER'/)
assert.match(source, /expected_privileges=/)
assert.match(source, /'SELECT','INSERT','UPDATE','DELETE','SHOW VIEW'/)
assert.match(source, /dangerous_privileges" == '0'/)
assert.match(source, /expected_privileges" == '5'/)

assert.match(source, /OUTPUT_FILE="\$\{OUTPUT_FILE:-\/mnt\/user\/pc\/kindrobots-db-agent\/kindrobots-db-agent\.env\}"/)
assert.match(source, /chmod 700 "\$output_dir"/)
assert.match(source, /umask 077/)
assert.match(source, /chmod 600 "\$OUTPUT_FILE"/)
assert.match(source, /^AGENT_DATABASE_URL=\$\{agent_url\}$/m)
assert.doesNotMatch(source, /printf[^\n]*(AGENT_DB_PASSWORD|agent_url)/)

assert.match(source, /replace Claude's existing DATABASE_URL with the AGENT_DATABASE_URL value/)
assert.match(source, /Do not give Claude MIGRATION_DATABASE_URL unless intentionally performing a migration/)

assert.match(tuningSource, /AGENT_CLIENT_CONNECTION_LIMIT="\$\{AGENT_CLIENT_CONNECTION_LIMIT:-3\}"/)
assert.match(tuningSource, /AGENT_CLIENT_MINIMUM_IDLE="\$\{AGENT_CLIENT_MINIMUM_IDLE:-0\}"/)
assert.match(tuningSource, /AGENT_CLIENT_IDLE_TIMEOUT_SECONDS="\$\{AGENT_CLIENT_IDLE_TIMEOUT_SECONDS:-30\}"/)
assert.match(tuningSource, /AGENT_CLIENT_ACQUIRE_TIMEOUT_MS="\$\{AGENT_CLIENT_ACQUIRE_TIMEOUT_MS:-10000\}"/)
assert.match(tuningSource, /AGENT_CLIENT_CONNECT_TIMEOUT_MS="\$\{AGENT_CLIENT_CONNECT_TIMEOUT_MS:-5000\}"/)
assert.match(tuningSource, /connection limit must not exceed the default six-backend agent lane/)
assert.match(tuningSource, /url\.searchParams\.set\('connectionLimit'/)
assert.match(tuningSource, /url\.searchParams\.set\('minimumIdle'/)
assert.match(tuningSource, /url\.searchParams\.set\('idleTimeout'/)
assert.match(tuningSource, /url\.searchParams\.set\('acquireTimeout'/)
assert.match(tuningSource, /url\.searchParams\.set\('connectTimeout'/)
assert.match(tuningSource, /url\.searchParams\.set\('minDelayValidation', '0'\)/)
assert.match(tuningSource, /url\.searchParams\.set\('pipelining', 'false'\)/)
assert.match(tuningSource, /AGENT_DATABASE_URL=\$\{url\.toString\(\)\}/)
assert.match(tuningSource, /chmodSync\(outputFile, 0o600\)/)
assert.doesNotMatch(tuningSource, /MIGRATION_DATABASE_URL/)
assert.doesNotMatch(tuningSource, /console\.log\([^\n]*AGENT_DATABASE_URL/)

console.log('Agent database lane provisioning contract passed.')
