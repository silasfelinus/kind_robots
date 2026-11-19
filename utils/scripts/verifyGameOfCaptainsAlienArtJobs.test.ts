import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ALIEN_SPECIES } from '../gameOfCaptains/alienSpecies'
import {
  COUCH_ALIEN_ART_JOB_IDS,
  COUCH_ALIEN_REDO_CANDIDATE_JOB_IDS,
} from '../gameOfCaptains/alienArtJobs'

const entries = Object.entries(COUCH_ALIEN_ART_JOB_IDS)
assert.equal(ALIEN_SPECIES.length, 101)
const reviewHolds = Object.entries(COUCH_ALIEN_REDO_CANDIDATE_JOB_IDS)
assert.equal(
  entries.length,
  85,
  'curated 81 species and four milestone paintings',
)
assert.equal(
  reviewHolds.length,
  22,
  '20 species and two milestones need visual curation',
)
assert.equal(new Set(entries.map(([key]) => key)).size, 85)
assert.equal(new Set(entries.map(([, id]) => id)).size, 85)
assert.equal(new Set(reviewHolds.map(([, id]) => id)).size, 22)
const originalRejects = new Set([
  52975, 52976, 52978, 52983, 52984, 52985, 52990, 52999, 53001, 53002, 53004,
  53011, 53013, 53020, 53034, 53042, 53043, 53051, 53052, 53057, 52956, 52957,
])
assert.equal(originalRejects.size, 22)
for (const [key, candidate] of reviewHolds) {
  assert.ok(!(key in COUCH_ALIEN_ART_JOB_IDS), `Review-held key served: ${key}`)
  assert.ok(Number.isInteger(candidate) && candidate > 0, key)
}
for (const [key, jobId] of entries) {
  assert.ok(!originalRejects.has(jobId), `Rejected original served: ${key}`)
}
assert.equal(entries.length + reviewHolds.length, 107)
for (const species of ALIEN_SPECIES) {
  const id =
    COUCH_ALIEN_ART_JOB_IDS[species.artKey] ??
    COUCH_ALIEN_REDO_CANDIDATE_JOB_IDS[species.artKey]
  assert.ok(
    typeof id === 'number' && Number.isInteger(id) && id > 0,
    species.name,
  )
}
for (const threshold of [5, 12, 25, 50, 75, 100]) {
  const key = 'aliens/milestone-' + threshold
  assert.ok(
    Number.isInteger(
      COUCH_ALIEN_ART_JOB_IDS[key] ?? COUCH_ALIEN_REDO_CANDIDATE_JOB_IDS[key],
    ),
    key,
  )
}
const route = readFileSync(
  new URL(
    '../../server/api/game-of-captains/alien-art.get.ts',
    import.meta.url,
  ),
  'utf8',
)
assert.match(route, /COUCH_ALIEN_ART_JOB_IDS/)
assert.doesNotMatch(route, /COUCH_ALIEN_REDO_CANDIDATE_JOB_IDS/)
assert.match(route, /status: 'DONE'/)
assert.match(route, /artImageId/)
assert.match(route, /getArtImageAccessContext\(event\)/)
assert.match(route, /buildArtImageWhere\(access\)/)
assert.match(route, /prisma\.artImage\.findMany/)
console.log(
  'Space Couch: 85 approved art jobs, 22 review-held rerenders, viewer access OK',
)
