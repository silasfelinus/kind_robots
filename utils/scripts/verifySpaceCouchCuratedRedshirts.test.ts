import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  curatedRedshirtArtKey,
  isApprovedRedshirtSelection,
} from '../gameOfCaptains/curatedRedshirtArt'
import { WARP_ART } from '../gameOfCaptains/artManifest'
import { REDSHIRT_ROUND3_CANDIDATES } from '../gameOfCaptains/redshirtRound3Candidates'

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
assert.ok(route.includes('isPublic: true'))
assert.ok(route.includes('isMature: false'))
assert.ok(route.includes('isActive: true'))
assert.ok(route.includes('isApprovedRedshirtSelection('))
assert.ok(route.includes('selectedArtImageId: { not: null }'))
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

const shipped = WARP_ART.filter((key) => key.startsWith('redshirts/portraits/'))
assert.ok(shipped.length > 0, 'existing approved art remains in the manifest')
assert.equal(
  WARP_ART.filter((key) => key.startsWith('redshirts/secret-powers/')).length,
  99,
  'do not invent the remaining secret-power plate',
)
console.log(
  'Space Couch selected ArtSlot delivery, privacy gates and shipped fallback verified',
)

assert.equal(REDSHIRT_ROUND3_CANDIDATES.length, 24)
assert.equal(
  REDSHIRT_ROUND3_CANDIDATES.filter(([key]) =>
    key.startsWith('redshirts/portraits/'),
  ).length,
  23,
)
assert.equal(
  REDSHIRT_ROUND3_CANDIDATES.filter(([key]) =>
    key.startsWith('redshirts/secret-powers/'),
  ).length,
  1,
)
assert.equal(new Set(REDSHIRT_ROUND3_CANDIDATES.map(([key]) => key)).size, 24)
assert.equal(new Set(REDSHIRT_ROUND3_CANDIDATES.map(([, id]) => id)).size, 24)
assert.equal(new Set(REDSHIRT_ROUND3_CANDIDATES.map(([, , id]) => id)).size, 24)
assert.ok(
  REDSHIRT_ROUND3_CANDIDATES.every(
    ([key, jobId, imageId]) =>
      curatedRedshirtArtKey(key) === key &&
      jobId >= 68251 &&
      jobId <= 68274 &&
      imageId >= 270068 &&
      imageId <= 270092 &&
      !WARP_ART.includes(key),
  ),
  'review candidates remain unshipped and must not overwrite accepted art',
)
const sync = readFileSync(
  'server/api/game-of-captains/redshirt-art/sync.post.ts',
  'utf8',
)
const forgeStore = readFileSync('stores/playbookForgeRedshirtsStore.ts', 'utf8')
const forge = readFileSync(
  'components/playbook-forge/playbook-forge-redshirts.vue',
  'utf8',
)
assert.ok(sync.includes('requireMachineUser(event)'))
assert.ok(sync.includes('assertCurator(auth)'))
assert.ok(sync.includes("job?.status === 'DONE'"))
assert.ok(sync.includes('job.artImageId === imageId'))
assert.ok(sync.includes('activeIds.has(imageId)'))
assert.ok(sync.includes('selectIfEmpty: false'))
assert.ok(!sync.includes('selectCandidate('))
assert.ok(!sync.includes('setCandidateVerdict('))
assert.ok(forgeStore.includes("'/api/game-of-captains/redshirt-art/sync'"))
assert.ok(
  forge.includes('data-testid="space-couch-register-redshirt-candidates"'),
)
assert.ok(forge.includes('data-testid="space-couch-curate-redshirt-art"'))
assert.ok(forge.includes("prefix: 'game-of-captains/redshirts/'"))
assert.ok(forge.includes("multiple: '0'"))
const curator = readFileSync('pages/admin/art-slots.vue', 'utf8')
assert.ok(curator.includes('const route = useRoute()'))
assert.ok(curator.includes('route.query.projectSlug'))
assert.ok(curator.includes('route.query.prefix'))
assert.ok(curator.includes("route.query.multiple === '0'"))
assert.ok(
  curator.indexOf('route.query.prefix') < curator.indexOf('await slotStore.load()'),
  'the targeted single-candidate view must load before the generic gallery',
)
