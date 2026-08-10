// /utils/scripts/verifyProjectScaffoldTodoParity.ts
//
// Kaizen from interface-vision/kind-robots t-056 (kind_robots#1678, reviewed 2026-08-09):
// the ordinary authenticated POST /api/projects path creates exactly one HIGH/AGENT
// scaffold Todo per Project (via prisma $transaction, with an idempotent
// direct-MariaDB-fallback equivalent when the pooled connection is stale), while
// Conductor's separate /api/conductor/sync projection path reconciles Projects
// through its own transaction and never queues one. That behavioral split had no
// dedicated coverage -- verifyDatabasePoolDefaults.ts's assertions on this same
// file only guard the fallback path's code *shape* (falls back to
// upsertProjectDirect on a stale connection), not the Todo-creation behavior on
// either path.
//
// No database is available to this DB-free contract suite (see
// .github/workflows/contract-tests.yml's header), so this asserts the source-level
// invariant instead of exercising a live request: every project-creation code path
// that a real POST /api/projects call can take -- transaction success, and the
// direct-MariaDB fallback taken on a stale pooled connection -- creates exactly one
// OPEN/HIGH/AGENT Todo tied to the new project, and the Conductor sync projection
// path creates none.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function countOccurrences(source: string, pattern: RegExp): number {
  return source.match(pattern)?.length ?? 0
}

const projectCreateSource = readFileSync(
  new URL('../../server/api/projects/index.post.ts', import.meta.url),
  'utf8',
)
const directWriteSourceRaw = readFileSync(
  new URL('../../server/utils/projectDirectWrite.ts', import.meta.url),
  'utf8',
)
// The raw SQL identifiers in this file are backtick-quoted inline inside
// template literals, so most (but not all -- one column list is a plain
// single-quoted string) appear on disk as an escaped `\`` pair rather than a
// bare backtick. Normalize both spellings to a bare backtick before matching
// so these assertions don't depend on which quoting style a given line uses.
const directWriteSource = directWriteSourceRaw.replaceAll('\\`', '`')
const conductorSyncSource = readFileSync(
  new URL('../../server/api/conductor/sync.post.ts', import.meta.url),
  'utf8',
)

// --- Path 1: POST /api/projects, transaction path ---------------------------
// Exactly one Todo is queued per Project create, inside the same transaction as
// the Project row (so it can never observably exist without its Project, or vice
// versa), tagged OPEN/HIGH/AGENT and linked via projectId.
assert.equal(
  countOccurrences(projectCreateSource, /tx\.todo\.create\(/g),
  1,
  'server/api/projects/index.post.ts must create exactly one Todo per Project, ' +
    'not zero (silently dropped scaffold) and not more than one (duplicate Todo).',
)
assert.match(
  projectCreateSource,
  /const project = await tx\.project\.create\(\{[\s\S]*?\}\)[\s\S]*?await tx\.todo\.create\(\{/,
  'The Todo must be created after the Project inside the same $transaction callback.',
)
assert.match(
  projectCreateSource,
  /status: 'OPEN',\s*\n\s*priority: 'HIGH',\s*\n\s*category: 'AGENT',/,
)
assert.match(projectCreateSource, /projectId: project\.id,/)

// --- Path 2: POST /api/projects, direct-MariaDB fallback path ---------------
// A stale pooled connection falls through to upsertProjectDirect, which must
// carry the same one-Todo-per-Project guarantee via its own idempotent insert
// (a plain second INSERT would duplicate the Todo on every retried fallback call
// for the same Project, since the fallback path is not itself transactional).
assert.match(
  projectCreateSource,
  /if \(!isStaleDatabaseConnectionError\(error\)\) throw error/,
  'Only a stale-connection failure may fall through to the direct-MariaDB path.',
)
assert.match(
  projectCreateSource,
  /return upsertProjectDirect\(data, conductorSlug\)/,
)
assert.equal(
  countOccurrences(directWriteSource, /INSERT INTO `Todo`/g),
  1,
  'server/utils/projectDirectWrite.ts must issue exactly one Todo insert per ' +
    'upsertProjectDirect call.',
)
assert.match(
  directWriteSource,
  /SELECT \?, \?, 'OPEN', 'HIGH', 'AGENT', \?, \?/,
  'The direct-write fallback must tag its Todo OPEN/HIGH/AGENT, matching the ' +
    'transaction path exactly.',
)
assert.match(
  directWriteSource,
  /WHERE NOT EXISTS \(/,
  'The direct-write fallback must guard its Todo insert with an idempotency ' +
    'check, since upsertProjectDirect is not wrapped in a transaction and may be ' +
    'retried for the same Project.',
)
assert.match(
  directWriteSource,
  /SELECT 1 FROM `Todo` WHERE `projectId` = \? AND `title` = \? AND `status` = 'OPEN'/,
  'The idempotency guard must key on the same Project + title + OPEN status the ' +
    'insert itself writes, or a retried fallback call could still duplicate the Todo.',
)
// The fallback's Todo insert must run after the Project row is written (and its
// id read back), never before -- a Todo cannot reference a Project that does not
// exist yet.
const projectInsertIndex = directWriteSource.indexOf('INSERT INTO `Project`')
const todoInsertIndex = directWriteSource.indexOf('INSERT INTO `Todo`')
assert.ok(
  projectInsertIndex >= 0 && todoInsertIndex > projectInsertIndex,
  'The direct-write fallback must insert the Project before the Todo that references it.',
)

// --- Path 3: POST /api/conductor/sync (Conductor projection sync) -----------
// The sync path creates/updates Project rows directly on its own prisma
// transaction and must never queue a scaffold Todo -- these are pre-existing
// Conductor-tracked projects being projected into kind_robots, not new user
// submissions that need an agent to go scaffold a roadmap for them.
assert.match(
  conductorSyncSource,
  /await tx\.project\.create\(\{/,
  'Conductor sync must still create Project rows for new Conductor projects.',
)
assert.doesNotMatch(
  conductorSyncSource,
  /todo/i,
  'server/api/conductor/sync.post.ts must never reference Todo in any form -- ' +
    'the Conductor projection path must not queue a scaffold Todo the way ' +
    'POST /api/projects does for a real user-submitted Project.',
)

console.log(
  'Project scaffold Todo parity verified: POST /api/projects (transaction and ' +
    'direct-fallback paths) each queue exactly one OPEN/HIGH/AGENT Todo per ' +
    'Project; /api/conductor/sync queues none.',
)
