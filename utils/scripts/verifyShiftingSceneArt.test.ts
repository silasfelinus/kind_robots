import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { JOURNEY_WORLD } from '../shiftingLands/journey'
import { findFiveLandCard } from '../shiftingLands/authoredFiveLands'
import {
  BESPOKE_CARDS,
  BESPOKE_OUTCOMES,
  ENCOUNTER_ART,
  bespokeArt,
  LAND_SCENERY,
  LOCATION_ART,
  TRIAL_ART,
  encounterArt,
  locationArt,
  outcomeArt,
  outcomeKey,
  trialArt,
} from '../shiftingLands/sceneArt'
import { AUTHORED_TRIALS } from '../shiftingLands/authoredBosses'
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
  assert.equal(
    encounterArt('homestead', card, null),
    bespokeArt(id) ?? ENCOUNTER_ART[id],
  )
}

const trialIds = JOURNEY_WORLD.lands.map((land) => 'trial-' + land.id)
assert.equal(new Set(BESPOKE_CARDS).size, BESPOKE_CARDS.length)
for (const id of BESPOKE_CARDS) {
  assert.ok(
    encounterIds.includes(id) || trialIds.includes(id),
    id + ' is not an authored encounter or trial-<land>',
  )
  shipped(bespokeArt(id)!)
}
// t-028: every painted consequence names a real card, choice and result, and
// ships from a served path. Unpainted outcomes fall back to their card art.
const outcomeKeys = [
  ...[...homestead.encounters, ...laterLands.encounters].flatMap((card) =>
    card.choices.flatMap((choice) => [
      outcomeKey(card.id, choice.id, true),
      outcomeKey(card.id, choice.id, false),
    ]),
  ),
  ...AUTHORED_TRIALS.flatMap((trial) =>
    trial.choices.flatMap((choice) => [
      outcomeKey('trial-' + trial.landId, choice.id, true),
      outcomeKey('trial-' + trial.landId, choice.id, false),
    ]),
  ),
]
assert.equal(new Set(outcomeKeys).size, outcomeKeys.length)
assert.equal(new Set(BESPOKE_OUTCOMES).size, BESPOKE_OUTCOMES.length)
for (const key of BESPOKE_OUTCOMES) {
  assert.ok(outcomeKeys.includes(key), key + ' is not an authored outcome')
  const [card, choice, result] = key.split('--')
  shipped(outcomeArt(card!, choice!, result === 'success')!)
}
assert.equal(outcomeArt('family-at-the-fence', 'not-a-choice', true), null)

for (const land of JOURNEY_WORLD.lands)
  if (BESPOKE_CARDS.includes('trial-' + land.id))
    assert.equal(
      trialArt(land.id, land.boss.art),
      bespokeArt('trial-' + land.id),
    )

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
assert.match(board, /:src="consequence\.plate\.src"/)
const store = readFileSync(
  toPath('../../stores/shiftingLandsJourneyStore.ts'),
  'utf8',
)
assert.match(store, /painted \?\? playedArt\(result\.locationId\)/)
assert.match(store, /'trial-' \+ result\.landId/)
for (const back of ['encounter-back.svg', 'trial-back.svg'])
  shipped('/shifting-lands/' + back)

console.log(
  'Shifting Lands scene art passed: 48 encounters, 15 roads and 5 trials resolve to shipped Zuzu art outside the /images mount',
)
