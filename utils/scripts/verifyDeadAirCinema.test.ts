import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  emptyMusicVideoDoc,
  normalizeMusicVideoDoc,
  serializeMusicVideoDoc,
} from '../musicVideoDoc'
import { remixMusicVideoDoc } from '../musicVideoAccess'

const before = emptyMusicVideoDoc({ pitch: 'A station addresses its audience.' })
const reviewedAt = '2026-11-14T23:25:00.000Z'
const { doc, errors } = normalizeMusicVideoDoc({
  ...before,
  review: { verdict: 'revise', notes: '  Make the final beat land.  ', reviewedAt },
})
assert.deepEqual(errors, [])
assert.deepEqual(doc.review, {
  verdict: 'revise',
  notes: 'Make the final beat land.',
  reviewedAt,
})
assert.deepEqual(
  normalizeMusicVideoDoc(JSON.parse(serializeMusicVideoDoc(doc))).doc.review,
  doc.review,
)
assert.equal(emptyMusicVideoDoc().review, undefined)
assert.equal(remixMusicVideoDoc(doc, false).review, undefined)
assert.equal(remixMusicVideoDoc(doc, true).review, undefined)
assert.ok(
  normalizeMusicVideoDoc({
    ...before,
    review: { verdict: 'publish', notes: 'bad', reviewedAt },
  }).errors.some((error) => error.includes('Unknown private film review verdict')),
)
assert.ok(
  normalizeMusicVideoDoc({
    ...before,
    review: { verdict: 'reject', reviewedAt: 'yesterday' },
  }).errors.some((error) => error.includes('valid timestamp')),
)

const page = readFileSync('pages/admin/dead-air.vue', 'utf8')
const metadata = readFileSync('content/channels/admin/dead-air.md', 'utf8')
const listing = readFileSync('server/api/music-video/index.get.ts', 'utf8')
const saveRoute = readFileSync('server/api/music-video/[id].patch.ts', 'utf8')
const readRoute = readFileSync('server/api/music-video/[id].get.ts', 'utf8')
const store = readFileSync('stores/musicVideoStore.ts', 'utf8')
assert.match(metadata, /route: \/admin\/dead-air/)
assert.match(metadata, /requiredRole: ADMIN/)
assert.match(page, /userStore\.isAdmin/)
assert.match(page, /selectedSummary\?\.hasFinal/)
assert.match(page, /store\.videoUrl\(selected\.id\)/)
assert.match(page, /shot\.image\.jobId/)
assert.match(page, /shot\.motion\.jobId/)
assert.match(page, /store\.savePrivateReview\(verdict\.value, notes\.value\)/)
assert.match(page, /Publication and deletion remain unchanged/)
assert.doesNotMatch(page, /store\.setPublic\(/)
assert.match(listing, /deadAirOnly/)
assert.match(listing, /userId: viewer\.userId \?\? -1/)
assert.match(listing, /startsWith: 'Dead Air:'/)
assert.match(store, /async function loadList\(series\?: 'dead-air'\)/)
assert.match(store, /async function savePrivateReview\(/)
assert.match(saveRoute, /await loadOwnedMusicVideo\(id, auth\.user\.id\)/)
assert.match(saveRoute, /data\.doc = serializeValidatedDoc\(body\.doc\)/)
assert.match(readRoute, /if \(!isMusicVideoOwner\(record, viewer\)\) delete result\.doc\.review/)
console.log('Dead Air private cinema: review, admin access and film provenance contracts passed.')
