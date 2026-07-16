// /utils/scripts/verifyDatabasePoolDefaults.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_CONNECTION_LIMIT,
  SAFE_MINIMUM_CONNECTION_LIMIT,
} from './../../server/utils/databasePoolDefaults'

// Regression guard: this fallback has silently dropped from 10 to 2 twice
// (e2caf03d, then kind_robots PR #296), each time causing a full production
// outage (every DB-backed route 503ing on pool exhaustion). Fail CI loudly
// instead of waiting for the next outage to notice.
assert.ok(
  DEFAULT_CONNECTION_LIMIT >= SAFE_MINIMUM_CONNECTION_LIMIT,
  `DEFAULT_CONNECTION_LIMIT (${DEFAULT_CONNECTION_LIMIT}) must be >= ` +
    `SAFE_MINIMUM_CONNECTION_LIMIT (${SAFE_MINIMUM_CONNECTION_LIMIT}) — ` +
    'see server/utils/databasePoolDefaults.ts',
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
  `Database pool safeguards verified: connection limit ${DEFAULT_CONNECTION_LIMIT} >= ` +
    `${SAFE_MINIMUM_CONNECTION_LIMIT}; stale Project creates bypass Prisma through direct MariaDB.`,
)
