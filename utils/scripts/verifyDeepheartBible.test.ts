import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ANTHRO_LOOK } from '../deepheart/anthro'
import { COURT_DEITIES } from '../deepheart/court'
import { CHARACTERS } from '../deepheart/roster'
import { DEEPHEART_ART_IDS, deepheartArtSrc } from '../deepheart/renderedArt'
import { DEEPHEART } from '../playbookKit/games/deepheart'

// Deepheart Bible is not a wall of private character prose: every god has
// actual artwork, every delver opens an inspector, and new art goes through
// a private, session-authorized, durable ArtJob request.
const courtImages = [
  275432, 275433, 275434, 275435, 275436, 275437, 275438, 275439, 275440,
  275441, 275442, 275443,
]
assert.equal(COURT_DEITIES.length, 12)
assert.equal(new Set(courtImages).size, COURT_DEITIES.length)
for (const [index, deity] of COURT_DEITIES.entries()) {
  assert.equal(
    DEEPHEART_ART_IDS[`court:${deity.id}`],
    courtImages[index],
    `${deity.name} must use the completed Krea 2 court encounter`,
  )
  assert.ok(deepheartArtSrc(`court:${deity.id}`))
  assert.equal(
    DEEPHEART.cast.find((member) => member.id === `fairy-${deity.id}`)?.portrait
      .src,
    deepheartArtSrc(`court:${deity.id}`),
    'the playable cast uses the same approved art as the bible',
  )
  assert.ok(deity.look.includes('human'), 'immortals keep human faces')
}
assert.equal(CHARACTERS.length, 50)
for (const person of CHARACTERS) {
  assert.ok(ANTHRO_LOOK[person.id], `${person.id} has a physical art prompt`)
  assert.ok(deepheartArtSrc(`cast:${person.id}`))
}

const page = readFileSync('pages/admin/deepheart/bible.vue', 'utf8')
assert.doesNotMatch(page, /World & style|key: 'canon'/)
assert.match(page, /@click="openDetail\('cast', person\.id\)"/)
assert.match(page, /@click="openDetail\('court', deity\.id\)"/)
assert.match(page, /data-testid="dh-bible-subject-detail"/)
assert.match(page, /data-testid="dh-bible-request-art"/)
assert.match(page, /deepheartArtSrc\('court:' \+ deity\.id\)/)
assert.match(page, /art\.loadJobImage\(job\.artImageId/)
assert.match(page, /\/api\/deepheart\/bible-art/)

const listing = readFileSync('server/api/deepheart/bible-art.get.ts', 'utf8')
const generation = readFileSync(
  'server/api/deepheart/bible-art.post.ts',
  'utf8',
)
const delivery = readFileSync('server/api/deepheart/art/[id].get.ts', 'utf8')
for (const route of [listing, generation]) {
  assert.match(route, /requireAdminApiUser/)
  assert.match(route, /viewerShowsMature/)
}
assert.match(listing, /projectSlug: 'deepheart'/)
assert.match(listing, /requestKey/)
assert.match(generation, /\/api\/art\/enqueue/)
assert.match(generation, /status: \{ in: \['PENDING', 'RUNNING'\] \}/)
assert.match(generation, /isPublic: false/)
assert.match(generation, /isMature: false/)
assert.match(generation, /requestKey:/)
assert.match(generation, /ANTHRO_LOOK/)
assert.match(generation, /COURT_DEITIES/)
assert.match(delivery, /Object\.values\(DEEPHEART_ART_IDS\)/)
assert.match(delivery, /canReadArtImage/)
assert.match(delivery, /image\.isMature === true/)

console.log(
  'Deepheart Art Bible: 50 delvers, 12 painted gods, private interactive repaint workflow verified.',
)
