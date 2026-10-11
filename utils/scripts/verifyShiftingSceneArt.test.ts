import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { JOURNEY_WORLD } from '../shiftingLands/journey'
import { findFiveLandCard } from '../shiftingLands/authoredFiveLands'
import {
  ENCOUNTER_ART,
  LAND_SCENERY,
  LOCATION_ART,
  TRIAL_ART,
  encounterArt,
  locationArt,
  trialArt,
} from '../shiftingLands/sceneArt'
import homestead from '../shiftingLands/authoredHomestead.json'
import laterLands from '../shiftingLands/authoredLaterLands.json'

const toPath = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const shipped = (url: string) => {
  assert.ok(url.startsWith('/'), url + ' must be site-absolute')
  // Production mounts the media share over /images, hiding anything the
  // image ships there. Card art must come from a path the image serves.
  assert.ok(!url.startsWith('/images/'), url + ' is shadowed in production')
  assert.ok(existsSync(toPath('../../public' + url)), url + ' is missing')
}

const encounterIds = [...homestead.encounters, ...laterLands.encounters].map(
  (card) => card.id,
)
assert.equal(encounterIds.length, 48)
assert.deepEqual(
  Object.keys(ENCOUNTER_ART).sort(),
  [...encounterIds].sort(),
  'every authored encounter needs exactly one card face',
)

const locationIds = JOURNEY_WORLD.lands.flatMap((land) =>
  land.locations.map((location) => location.id),
)
assert.equal(locationIds.length, 15)
assert.deepEqual(Object.keys(LOCATION_ART).sort(), [...locationIds].sort())
assert.deepEqual(
  Object.keys(TRIAL_ART).sort(),
  JOURNEY_WORLD.lands.map((land) => land.id).sort(),
)
assert.deepEqual(
  Object.keys(LAND_SCENERY).sort(),
  JOURNEY_WORLD.lands.map((land) => land.id).sort(),
)

for (const url of [
  ...Object.values(ENCOUNTER_ART),
  ...Object.values(LOCATION_ART),
  ...Object.values(TRIAL_ART),
  ...Object.values(LAND_SCENERY),
])
  shipped(url)

for (const land of JOURNEY_WORLD.lands) {
  shipped(trialArt(land.id, land.boss.art))
  for (const location of land.locations) {
    shipped(locationArt(land.id, location))
    shipped(encounterArt(land.id, null, location))
  }
}
for (const id of encounterIds) {
  const card = findFiveLandCard(id)
  assert.ok(card, id)
  assert.equal(card!.art, null, 'authored packs stay unpainted for t-023')
  assert.equal(encounterArt('homestead', card, null), ENCOUNTER_ART[id])
}

const board = readFileSync(
  toPath('../../components/shifting-lands-journey-board.vue'),
  'utf8',
)
assert.doesNotMatch(board, /["'(]\/images\//)
assert.doesNotMatch(board, /art pending|preview/i)
// components/ is registered with pathPrefix: false; a prefixed name never
// resolves and silently renders nothing.
assert.match(board, /<FlipCard\b/)
assert.doesNotMatch(board, /NavigationFlipCard/)
assert.match(board, /<div class="absolute inset-0">\s*<FlipCard/)
assert.match(board, /:src="game\.roadArt\(card\.id\)"/)
assert.match(board, /:src="game\.activeArt"/)
assert.match(board, /:src="game\.bossArt"/)
assert.match(board, /:src="game\.playedArt\(inspectedCard\.id\)"/)
for (const back of ['encounter-back.svg', 'trial-back.svg'])
  shipped('/shifting-lands/' + back)

console.log(
  'Shifting Lands scene art passed: 48 encounters, 15 roads and 5 trials resolve to shipped Zuzu art outside the /images mount',
)
