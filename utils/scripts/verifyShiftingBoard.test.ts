import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  JOURNEY_WORLD,
  newJourney,
  reachableLocations,
  stepJourney,
  restoreJourney,
  type JourneyState,
} from '../shiftingLands/journey'

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const read = (path: string) => readFileSync(file(path), 'utf8')
const page = read('../../pages/admin/zuzu-shifting-lands.vue')
const board = read('../../components/shifting-lands-journey-board.vue')
const store = read('../../stores/shiftingLandsJourneyStore.ts')
const legacy = read('../../stores/shiftingLandsStore.ts')
const channel = read('../../content/channels/admin/zuzu-shifting-lands.md')

assert.match(channel, /requiredRole: ADMIN/)
assert.match(channel, /route: \/admin\/zuzu-shifting-lands/)
assert.doesNotMatch(channel, /navigation: false/)
assert.match(page, /v-else-if="!legacyMode"/)
assert.match(page, /ShiftingLandsJourneyBoard/)
assert.match(page, /@legacy="legacyMode = true"/)
assert.match(page, /legacyMode = false/)
assert.equal(
  existsSync(file('../../pages/play/zuzu-shifting-lands.vue')),
  false,
)

assert.match(board, /NavigationFlipCard/)
assert.match(board, /<kr-card-flip/)
assert.match(board, /card-back1\.webp/)
assert.match(board, /card-back2\.webp/)
assert.match(board, /card-back3\.webp/)
assert.match(board, /v-for="\(card, index\) in game\.locations"/)
assert.match(board, /game\.reachable\.includes\(card\.id\)/)
assert.match(
  board,
  /:disabled="!revealed\(card\.id\) && !game\.reachable\.includes\(card\.id\)"/,
)
assert.match(board, /game\.currentLand\.boss/)
assert.match(board, /game\.confront\('challenge'\)/)
assert.match(board, /game\.confront\('parley'\)/)
assert.match(board, /game\.confront\('retreat'\)/)
assert.match(board, /@click="game\.resolve\('test'\)"/)
assert.match(board, /@click="game\.resolve\('withdraw'\)"/)
assert.match(board, /v-for="card in visitedCards"/)
assert.match(board, /game\.currentShift\.reason/)
assert.match(board, /game\.state\.journal/)
assert.match(board, /aria-label=/)
assert.match(board, /focus-visible:/)
assert.match(board, /onMounted\(\(\) => game\.initialize\(\)\)/)
assert.doesNotMatch(board, /\b(?:localStorage|\$fetch|fetch\()\b/)

assert.match(store, /restoreJourney\(JSON\.parse\(saved\)\)/)
assert.match(store, /if \(next === state\.value\) return false/)
assert.match(store, /stepJourney\(state\.value, action\)/)
assert.match(store, /game\.|const SAVE_KEY = 'kr\.shiftingLands\.journey\.v1'/)
assert.match(legacy, /const SAVE_KEY = 'kr\.shiftingLands\.homestead\.v1'/)
assert.match(store, /if \(!loaded\.value\) return false/)
assert.match(store, /if \(!import\.meta\.client\) return/)
assert.match(store, /window\.localStorage\.setItem\(SAVE_KEY/)

assert.equal(JOURNEY_WORLD.lands.length, 5)
const beginning = newJourney(45)
assert.equal(reachableLocations(beginning).length, 2)
const unreachable = beginning.layouts.homestead!.find(
  (id) => !reachableLocations(beginning).includes(id),
)!
assert.strictEqual(
  stepJourney(beginning, { type: 'TRAVEL', locationId: unreachable }),
  beginning,
)

const chosen = reachableLocations(beginning)[0]!
const arriving = stepJourney(beginning, { type: 'TRAVEL', locationId: chosen })
assert.equal(arriving.active, chosen)
const resolved = stepJourney(arriving, { type: 'RESOLVE', approach: 'test' })
assert.equal(resolved.resolved.length, 1)
assert.equal(
  restoreJourney(JSON.parse(JSON.stringify(resolved))) !== null,
  true,
)
assert.equal(
  stepJourney(resolved, { type: 'RESOLVE', approach: 'test' }),
  resolved,
)
assert.strictEqual(
  stepJourney(resolved, { type: 'BOSS', approach: 'challenge' }),
  resolved,
)

let nearBoss: JourneyState = newJourney(14)
for (let i = 0; i < 3; i++) {
  const next = reachableLocations(nearBoss).find(
    (id) => !nearBoss.resolved.some((item) => item.locationId === id),
  )!
  nearBoss = stepJourney(nearBoss, { type: 'TRAVEL', locationId: next })
  nearBoss = stepJourney(nearBoss, { type: 'RESOLVE', approach: 'withdraw' })
}
assert.equal(nearBoss.phase, 'boss')
assert.deepEqual(reachableLocations(nearBoss), [])
assert.equal(nearBoss.resolved.length, 3)

assert.ok(
  JOURNEY_WORLD.lands
    .slice(1)
    .every((land) => land.locations.every((location) => location.art === null)),
)
assert.doesNotMatch(
  JSON.stringify(JOURNEY_WORLD),
  /canon_motivation|world_mysteries|sacrifice/,
)

console.log(
  'Shifting Lands Admin board contract passed: safe card reveals, five-land controls, real reducer integration, legacy save isolation and inspectable history',
)
