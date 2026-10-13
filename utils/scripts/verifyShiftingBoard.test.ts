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
const channel = read('../../content/channels/projects/zuzu-shifting-lands.md')

assert.match(channel, /requiredRole: GUEST/)
assert.match(channel, /route: \/play\/zuzu-shifting-lands/)
assert.doesNotMatch(channel, /navigation: false/)
assert.match(page, /v-else-if="!legacyMode"/)
assert.match(page, /ShiftingLandsJourneyBoard/)
assert.match(page, /@legacy="legacyMode = true"/)
assert.match(page, /legacyMode = false/)
const publicPage = read('../../pages/play/zuzu-shifting-lands.vue')
assert.match(publicPage, /ShiftingLandsJourneyBoard/)
assert.doesNotMatch(publicPage, /isAdmin|admin-only|private workshop/)

assert.match(board, /<FlipCard\b/)
assert.match(board, /<kr-card-flip/)
assert.match(board, /encounter-back\.svg/)
assert.match(board, /trial-back\.svg/)
assert.match(board, /v-for="option in game\.activeEncounter\.choices"/)
assert.match(board, /v-for="\(card, index\) in game\.locations"/)
assert.match(board, /game\.reachable\.includes\(card\.id\)/)
assert.match(board, /:disabled=/)
assert.match(board, /!revealed\(card\.id\)/)
assert.match(board, /!game\.reachable\.includes\(card\.id\)/)
assert.match(board, /game\.currentLand\.boss/)
assert.match(board, /confrontWithCue\('challenge'\)/)
assert.match(board, /confrontWithCue\('parley'\)/)
assert.match(board, /game\.confront\('retreat'\)/)
assert.match(board, /@click="resolveWithCue\('test'\)"/)
assert.match(board, /@click="resolveWithCue\('withdraw'\)"/)
assert.match(board, /v-for="card in visitedCards"/)
assert.match(board, /game\.currentShift\.reason/)
assert.match(board, /game\.state\.journal/)
assert.match(board, /aria-label=/)
assert.match(board, /focus-visible:/)
assert.match(board, /onMounted\(\(\) => \{/)
assert.match(board, /game\.initialize\(\)/)
assert.doesNotMatch(board, /\b(?:localStorage|\$fetch|fetch\()\b/)

assert.match(store, /restoreJourneyLedgerV5\(JSON\.parse\(saved\)\)/)
assert.match(store, /restoreJourneyLedgerV4\(JSON\.parse\(savedV4\)\)/)
assert.match(store, /restoreJourneyLedger\(JSON\.parse\(savedV3\)\)/)
assert.match(store, /migrateJourneyLedger\(JSON\.parse\(legacy\)\)/)
assert.match(store, /if \(next === ledger\.value\) return false/)
assert.match(
  store,
  /stepJourneyLedger\(active, action as JourneyLedgerAction\)/,
)
assert.match(
  store,
  /stepJourneyLedgerV4\(active, action as JourneyLedgerAction\)/,
)
assert.match(store, /stepJourneyLedgerV5\(active, action\)/)
assert.match(store, /const SAVE_KEY = 'kr\.shiftingLands\.journeyLedger\.v5'/)
assert.match(
  store,
  /const LEGACY_V4_SAVE_KEY = 'kr\.shiftingLands\.journeyLedger\.v4'/,
)
assert.match(
  store,
  /const LEGACY_V3_SAVE_KEY = 'kr\.shiftingLands\.journeyLedger\.v3'/,
)
assert.match(
  store,
  /const LEGACY_SAVE_KEY = 'kr\.shiftingLands\.authoredJourney\.v2'/,
)
assert.match(store, /if \(saved !== null\) \{/)
assert.match(store, /if \(restored\) ledger\.value = restored/)
assert.match(store, /else restoreWarning\.value = true/)
assert.match(store, /if \(legacy === null\) return/)
assert.match(store, /persist\(\)/)
assert.match(store, /useReward\(rewardId: string\)/)
assert.match(legacy, /const SAVE_KEY = 'kr\.shiftingLands\.homestead\.v1'/)
assert.match(store, /if \(!loaded\.value\) return false/)
assert.match(store, /if \(!import\.meta\.client\) return/)
assert.match(store, /window\.localStorage\.setItem\(key/)
assert.match(store, /const key =\s+ledger\.value\.version === 5/)
assert.match(store, /if \(savedV3 !== null\) \{/)
assert.match(board, /findFiveLandCard/)
assert.match(board, /v-for="choice in game\.currentTrial\.choices"/)
assert.match(board, /attemptTrialWithCue\(choice\.id\)/)
assert.match(
  board,
  /if \(!game\.attemptTrial\(id\)\) return\s+cueDiceResult\(\)/,
)
assert.match(
  board,
  /showConsequence\('trial', game\.lastTrialOutcome\?\.turn\)/,
)
assert.match(
  board,
  /showConsequence\('encounter', game\.lastAuthoredOutcome\?\.turn\)/,
)
assert.match(board, /game\.lastTrialOutcome\.resultText/)
assert.match(store, /if \(savedV4 !== null\) \{/)
assert.match(store, /attemptTrial\(choiceId: string\)/)

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
