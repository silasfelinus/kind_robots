import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  curatedRedshirtArtKey,
  isApprovedRedshirtSelection,
  isSpaceCouchRedshirtSlot,
  preferCanonicalRedshirtSlots,
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

// A foreign project may not supply art just by copying our slot key. Older
// canonical keys without projectSlug remain readable for compatibility.
assert.equal(
  isSpaceCouchRedshirtSlot('game-of-captains', 'redshirts/portraits/rs-001'),
  true,
)
assert.equal(
  isSpaceCouchRedshirtSlot(null, 'game-of-captains/redshirts/portraits/rs-001'),
  true,
)
assert.equal(
  isSpaceCouchRedshirtSlot(
    'other-project',
    'game-of-captains/redshirts/portraits/rs-001',
  ),
  false,
)
assert.equal(
  isSpaceCouchRedshirtSlot(null, 'redshirts/portraits/rs-001'),
  false,
)
assert.equal(
  isSpaceCouchRedshirtSlot(
    'game-of-captains',
    'redshirts/portraits/rs-001/other',
  ),
  false,
)

// Prefer the curator's fully qualified slot over a legacy short alias.
// Sorting must not mutate data returned by Prisma.
const legacySlot = { slotKey: 'redshirts/portraits/rs-001', id: 7 }
const canonicalSlot = {
  slotKey: 'game-of-captains/redshirts/portraits/rs-001',
  id: 8,
}
const unorderedSlots = [legacySlot, canonicalSlot]
assert.deepEqual(
  preferCanonicalRedshirtSlots(unorderedSlots).map((slot) => slot.id),
  [8, 7],
)
assert.deepEqual(
  unorderedSlots.map((slot) => slot.id),
  [7, 8],
)
assert.deepEqual(preferCanonicalRedshirtSlots([]), [])

const route = readFileSync(
  'server/api/game-of-captains/redshirt-art.get.ts',
  'utf8',
)
assert.ok(route.includes('isPublic: true'))
assert.ok(route.includes('isMature: false'))
assert.ok(route.includes('isActive: true'))
assert.ok(route.includes('isApprovedRedshirtSelection('))
assert.ok(route.includes('isSpaceCouchRedshirtSlot('))
assert.ok(route.includes('preferCanonicalRedshirtSlots(selected)'))
assert.ok(route.includes('if (sources[slot.key]) continue'))
assert.ok(route.includes('projectSlug: null'))
assert.ok(route.includes("projectSlug: 'game-of-captains'"))
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
  // The 100th plate (rs-007) shipped only after the 2026-11-22 PT
  // REDSHIRTS-ROUND-3 keep verdict; never add plates without one.
  100,
  'every secret-power plate is a curated keeper',
)
console.log(
  'Space Couch selected ArtSlot delivery, privacy gates and shipped fallback verified',
)

// Curated 2026-11-22 PT (conductor REDSHIRTS-ROUND-3.yaml verdicts): 17 keep,
// 7 redo (rs-024, 036, 046, 055, 063, 073, 095 re-render in CURATION-REDO-2).
const ROUND3_KEEPERS = new Set([
  ...[2, 3, 5, 6, 7, 9, 10, 13, 15, 18, 22, 64, 69, 88, 99, 100].map(
    (n) => `redshirts/portraits/rs-${String(n).padStart(3, '0')}`,
  ),
  'redshirts/secret-powers/rs-007',
  // CURATION-REDO-2 keepers (2026-11-22 PT) for the seven round-3 rejects.
  ...[24, 36, 46, 55, 63, 73, 95].map(
    (n) => `redshirts/portraits/rs-${String(n).padStart(3, '0')}`,
  ),
])
assert.equal(ROUND3_KEEPERS.size, 24)
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
      WARP_ART.includes(key) === ROUND3_KEEPERS.has(key),
  ),
  'only curated round-3 keepers ship; rejected candidates stay unshipped',
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
  curator.indexOf('route.query.prefix') <
    curator.indexOf('await slotStore.load()'),
  'the targeted single-candidate view must load before the generic gallery',
)
