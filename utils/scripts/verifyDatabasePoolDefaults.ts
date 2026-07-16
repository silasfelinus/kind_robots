// /utils/scripts/verifyDatabasePoolDefaults.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_ACQUIRE_TIMEOUT_MS,
  DEFAULT_CONNECTION_LIMIT,
  DEFAULT_CONNECT_TIMEOUT_MS,
  DEFAULT_IDLE_TIMEOUT_SECONDS,
  DEFAULT_MINIMUM_IDLE,
  DEFAULT_PING_TIMEOUT_MS,
  SAFE_MINIMUM_CONNECTION_LIMIT,
} from './../../server/utils/databasePoolDefaults'

// Regression guards for the two production pool failure modes:
// - too few connections starve every DB-backed route
// - retiring every idle connection after 15 seconds leaves warm Vercel instances
//   reusing or recreating unhealthy ProxySQL sockets during sustained API tests
assert.ok(
  DEFAULT_CONNECTION_LIMIT >= SAFE_MINIMUM_CONNECTION_LIMIT,
  `DEFAULT_CONNECTION_LIMIT (${DEFAULT_CONNECTION_LIMIT}) must be >= ` +
    `SAFE_MINIMUM_CONNECTION_LIMIT (${SAFE_MINIMUM_CONNECTION_LIMIT}) — ` +
    'see server/utils/databasePoolDefaults.ts',
)
assert.ok(
  DEFAULT_ACQUIRE_TIMEOUT_MS > DEFAULT_CONNECT_TIMEOUT_MS,
  'DEFAULT_ACQUIRE_TIMEOUT_MS must exceed DEFAULT_CONNECT_TIMEOUT_MS',
)
assert.ok(
  DEFAULT_IDLE_TIMEOUT_SECONDS >= 300,
  'DEFAULT_IDLE_TIMEOUT_SECONDS must retain pooled sockets for at least 5 minutes',
)
assert.ok(
  DEFAULT_MINIMUM_IDLE >= 1 &&
    DEFAULT_MINIMUM_IDLE <= DEFAULT_CONNECTION_LIMIT,
  'DEFAULT_MINIMUM_IDLE must keep at least one connection warm without exceeding the pool limit',
)
assert.ok(
  DEFAULT_PING_TIMEOUT_MS >= 500 && DEFAULT_PING_TIMEOUT_MS <= 5_000,
  'DEFAULT_PING_TIMEOUT_MS must bound validation without making every borrow slow',
)

const prismaSource = readFileSync(
  new URL('../../server/utils/prisma.ts', import.meta.url),
  'utf8',
)
const directProbeSource = readFileSync(
  new URL('../../server/utils/databaseDirectProbe.ts', import.meta.url),
  'utf8',
)
const directProjectSource = readFileSync(
  new URL('../../server/utils/projectDirectWrite.ts', import.meta.url),
  'utf8',
)
const projectCreateSource = readFileSync(
  new URL('../../server/api/projects/index.post.ts', import.meta.url),
  'utf8',
)

assert.match(prismaSource, /process\.env\.DATABASE_PING_TIMEOUT_MS/)
assert.match(prismaSource, /pingTimeout:\s*readPositiveInteger/)
assert.match(prismaSource, /DEFAULT_IDLE_TIMEOUT_SECONDS/)
assert.match(prismaSource, /DEFAULT_MINIMUM_IDLE/)
assert.doesNotMatch(prismaSource, /DATABASE_IDLE_TIMEOUT_SECONDS,\s*15/)
assert.doesNotMatch(prismaSource, /DATABASE_MINIMUM_IDLE,\s*0/)

// Project Sync can encounter a stale socket retained by a warm Vercel instance.
// Recovery must bypass the Prisma adapter pool through the same direct MariaDB
// connection path used by the production database probe. It must never
// disconnect the shared Prisma client, which aborts unrelated transactions.
assert.doesNotMatch(prismaSource, /basePrisma\.\$disconnect\(\)/)
assert.doesNotMatch(prismaSource, /createIsolatedPrismaClient/)
assert.match(
  directProbeSource,
  /export async function createDatabaseDirectConnection\(\)/,
)
assert.match(directProjectSource, /ON DUPLICATE KEY UPDATE/)
assert.match(directProjectSource, /await connection\.end\(\)/)
assert.match(
  projectCreateSource,
  /if \(!isStaleDatabaseConnectionError\(error\)\) throw error/,
)
assert.match(
  projectCreateSource,
  /return upsertProjectDirect\(data, conductorSlug\)/,
)

console.log(
  `Database pool safeguards verified: limit=${DEFAULT_CONNECTION_LIMIT}, ` +
    `connect=${DEFAULT_CONNECT_TIMEOUT_MS}ms, acquire=${DEFAULT_ACQUIRE_TIMEOUT_MS}ms, ` +
    `idle=${DEFAULT_IDLE_TIMEOUT_SECONDS}s, minimumIdle=${DEFAULT_MINIMUM_IDLE}, ` +
    `ping=${DEFAULT_PING_TIMEOUT_MS}ms; stale Project creates bypass Prisma through direct MariaDB.`,
)
