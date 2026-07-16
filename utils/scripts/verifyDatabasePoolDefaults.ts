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
const projectCreateSource = readFileSync(
  new URL('../../server/api/projects/index.post.ts', import.meta.url),
  'utf8',
)

// Project Sync can encounter a stale socket retained by a warm Vercel instance.
// Recovery must use a fresh one-connection client and must never disconnect the
// shared Prisma client, which would abort unrelated in-flight transactions.
assert.match(
  prismaSource,
  /export function createIsolatedPrismaClient\(\): PrismaClient/,
)
assert.match(prismaSource, /searchParams\.set\('connectionLimit', '1'\)/)
assert.doesNotMatch(prismaSource, /basePrisma\.\$disconnect\(\)/)
assert.match(
  projectCreateSource,
  /if \(!isStaleDatabaseConnectionError\(error\)\) throw error/,
)
assert.match(
  projectCreateSource,
  /isolatedPrisma\.project\.upsert\([\s\S]*where: \{ conductorSlug \}/,
)
assert.match(projectCreateSource, /await isolatedPrisma\.\$disconnect\(\)/)

console.log(
  `Database pool safeguards verified: connection limit ${DEFAULT_CONNECTION_LIMIT} >= ` +
    `${SAFE_MINIMUM_CONNECTION_LIMIT}; stale Project creates use an isolated client.`,
)
