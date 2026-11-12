// Request keys: one named art request renders once and can always be found.
//
// 2026-11-11 PT, Silas: "we keep finding art that was requested and made but
// not linked". Conductor writes each ledger cell's job id to disk and commits
// it later; a killed thread agent or a timed-out Auto Art run lost those ids,
// and /api/art/enqueue had no dedup, so the next sweep rendered the cell again.
// server/utils/artRequestKey.ts gives each cell a stable name; this pins the
// pieces that make that name useful.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ART_REQUEST_KEY_REUSABLE_STATUSES,
  artRequestKeyFingerprint,
  normalizeArtRequestKey,
} from '../../server/utils/artRequestKey'
import { attemptFingerprintFromPayload } from '../../server/utils/artJobPayload'

const key =
  'conductor:projects/slime-city/art/IRONJAW-LIZARDS-ROUND-2.yaml#slime-r16-evo-union-millwright-l2-lizard@krea-evolution'

// Normalization: absent is null, real keys survive trimmed, junk is a 400.
assert.equal(normalizeArtRequestKey(undefined), null)
assert.equal(normalizeArtRequestKey(null), null)
assert.equal(normalizeArtRequestKey(''), null)
assert.equal(normalizeArtRequestKey(`  ${key}  `), key)
for (const bad of [
  42,
  'has space',
  'x'.repeat(301),
  '-leading-dash',
  'semi;colon',
]) {
  assert.throws(
    () => normalizeArtRequestKey(bad),
    (error: { statusCode?: number }) => error.statusCode === 400,
    `expected a 400 for ${JSON.stringify(bad).slice(0, 40)}`,
  )
}

// Fingerprint: deterministic, distinct per key, and fits the VarChar(64) column.
const fingerprint = artRequestKeyFingerprint(key)
assert.equal(fingerprint, artRequestKeyFingerprint(key))
assert.notEqual(fingerprint, artRequestKeyFingerprint(`${key}-b`))
assert.equal(fingerprint.length, 64)
assert.ok(fingerprint.startsWith('request:'))

// A failed or cancelled cell must re-render; live and finished ones are reused.
assert.deepEqual(
  [...ART_REQUEST_KEY_REUSABLE_STATUSES],
  ['PENDING', 'RUNNING', 'DONE'],
)

// Re-enqueue derives the column from the payload. Claim re-stamps
// payload.attemptFingerprint with the provenance hash, so the key must win.
assert.equal(
  attemptFingerprintFromPayload({
    requestKey: key,
    attemptFingerprint: 'provenance-hash',
  }),
  fingerprint,
)
assert.equal(
  attemptFingerprintFromPayload({ attemptFingerprint: 'provenance-hash' }),
  'provenance-hash',
)
assert.equal(attemptFingerprintFromPayload({}), null)

// The enqueue route dedups on the key before it creates (or charges for) a job,
// and stores both the column and the readable key.
const route = readFileSync('server/api/art/enqueue.post.ts', 'utf8')
const dedupAt = route.indexOf('attemptFingerprint: requestKeyFingerprint,')
const createAt = route.indexOf('const job = await prisma.artJob.create(')
assert.ok(
  dedupAt > 0,
  'enqueue must look up an existing job by request-key fingerprint',
)
assert.ok(
  createAt > dedupAt,
  'the request-key lookup must run before artJob.create',
)
assert.match(
  route,
  /attemptFingerprint: resourcePreviewFingerprint \?\? requestKeyFingerprint/,
)
assert.match(route, /payload\.requestKey = requestKey/)
assert.ok(
  route.indexOf('normalizeArtRequestKey(body?.requestKey)') <
    route.indexOf('await authAndGate('),
  'a malformed requestKey must be refused before the mana gate',
)

// The producer lane (/api/art/queue) dedups on the key's fingerprint too.
const queueRoute = readFileSync('server/api/art/queue/index.post.ts', 'utf8')
assert.match(queueRoute, /normalizeArtRequestKey\(body\?\.requestKey\)/)
assert.match(
  queueRoute,
  /attemptFingerprint: dedupFingerprint,[\s\S]*attemptFingerprint: dedupFingerprint,/,
)
assert.match(queueRoute, /payload\.requestKey = requestKey/)

// The lookup route reads the indexed column for the caller's own jobs only.
const lookup = readFileSync('server/api/art/queue/lookup.post.ts', 'utf8')
assert.match(lookup, /userId: auth\.user\.id/)
assert.match(lookup, /attemptFingerprint: \{ in:/)
assert.doesNotMatch(lookup, /payload: \{ contains/)

console.log('art request key: ok')
