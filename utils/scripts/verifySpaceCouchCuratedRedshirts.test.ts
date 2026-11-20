import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  curatedRedshirtArtKey,
  isApprovedRedshirtSelection,
} from '../gameOfCaptains/curatedRedshirtArt'
import { WARP_ART } from '../gameOfCaptains/artManifest'

assert.equal(
  curatedRedshirtArtKey('game-of-captains/redshirts/portraits/rs-002'),
  'redshirts/portraits/rs-002',
)
assert.equal(
  curatedRedshirtArtKey('redshirts/secret-powers/rs-100'),
  'redshirts/secret-powers/rs-100',
)
for (const invalid of [
  'redshirts/portraits/rs-000',
  'redshirts/portraits/rs-101',
  'redshirts/portraits/rs-1',
  'redshirts/portraits/rs-001/other',
  'other-project/redshirts/portraits/rs-001',
  'redshirts/portraits/../../../secret',
  'redshirts/candidates/rs-001',
]) {
  assert.equal(curatedRedshirtArtKey(invalid), null, invalid)
}
assert.equal(
  isApprovedRedshirtSelection(123, [{ artImageId: 123, verdict: 'liked' }]),
  true,
)
assert.equal(
  isApprovedRedshirtSelection(null, [{ artImageId: 123, verdict: 'liked' }]),
  false,
)
for (const verdict of ['none', 'rejected', 'duplicate']) {
  assert.equal(
    isApprovedRedshirtSelection(123, [{ artImageId: 123, verdict }]),
    false,
    verdict + ' is not a verified curated selection',
  )
}
assert.equal(
  isApprovedRedshirtSelection(123, [{ artImageId: 124, verdict: 'liked' }]),
  false,
  'approval for another render cannot promote this one',
)

const route = readFileSync(
  'server/api/game-of-captains/redshirt-art.get.ts',
  'utf8',
)
assert.ok(route.includes("isPublic: true"))
assert.ok(route.includes("isMature: false"))
assert.ok(route.includes("isActive: true"))
assert.ok(route.includes('isApprovedRedshirtSelection('))
assert.ok(route.includes("selectedArtImageId: { not: null }"))
assert.ok(!route.includes("status: 'DONE'"))
assert.ok(!route.includes('artJob.findMany'))

const store = readFileSync('stores/gameOfCaptainsStore.ts', 'utf8')
const page = readFileSync('pages/play/game-of-captains.vue', 'utf8')
const consoleView = readFileSync(
  'components/gameOfCaptains/daily-console.vue',
  'utf8',
)
assert.ok(store.includes("'/api/game-of-captains/redshirt-art'"))
assert.ok(page.includes(':redshirt-artwork="store.redshirtArtwork"'))
assert.ok(page.includes('void store.loadRedshirtArtwork()'))
assert.ok(consoleView.includes('image: redshirtPortrait(id)'))
assert.ok(consoleView.includes('const shipped = warpArt(key)'))
assert.ok(consoleView.includes('!brokenArtwork.value.includes(reviewed)'))
assert.ok(consoleView.includes('@error="onEpisodeArtworkError"'))

const shipped = WARP_ART.filter((key) =>
  key.startsWith('redshirts/portraits/'),
)
assert.ok(shipped.length > 0, 'existing approved art remains in the manifest')
assert.equal(
  WARP_ART.filter((key) =>
    key.startsWith('redshirts/secret-powers/'),
  ).length,
  99,
  'do not invent the remaining secret-power plate',
)
console.log(
  'Space Couch selected ArtSlot delivery, privacy gates and shipped fallback verified',
)
