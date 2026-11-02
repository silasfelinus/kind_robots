import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ALIEN_SPECIES } from '../gameOfCaptains/alienSpecies'
import { COUCH_ALIEN_ART_JOB_IDS } from '../gameOfCaptains/alienArtJobs'

const entries = Object.entries(COUCH_ALIEN_ART_JOB_IDS)
assert.equal(ALIEN_SPECIES.length, 101)
assert.equal(entries.length, 107, '101 lifeforms plus six milestone paintings')
assert.equal(new Set(entries.map(([key]) => key)).size, 107)
assert.equal(new Set(entries.map(([, id]) => id)).size, 107)
for (const species of ALIEN_SPECIES) {
  const id = COUCH_ALIEN_ART_JOB_IDS[species.artKey]
  assert.ok(typeof id === 'number' && Number.isInteger(id) && id > 0, species.name)
}
for (const threshold of [5, 12, 25, 50, 75, 100]) {
  const key = 'aliens/milestone-' + threshold
  assert.ok(Number.isInteger(COUCH_ALIEN_ART_JOB_IDS[key]), key)
}
const route = readFileSync(
  new URL(
    '../../server/api/game-of-captains/alien-art.get.ts',
    import.meta.url,
  ),
  'utf8',
)
assert.match(route, /COUCH_ALIEN_ART_JOB_IDS/)
assert.match(route, /status: 'DONE'/)
assert.match(route, /artImageId/)
assert.match(route, /getArtImageAccessContext\(event\)/)
assert.match(route, /buildArtImageWhere\(access\)/)
assert.match(route, /prisma\.artImage\.findMany/)
console.log(
  'Space Couch: 107 verified ArtJob slots, gated DONE+ArtImage viewer access OK',
)
