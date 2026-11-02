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
const page = read('../../pages/play/zuzu-shifting-lands.vue')
const board = read('../../components/shifting-lands-journey-board.vue')
const store = read('../../stores/shiftingLandsJourneyStore.ts')
const legacy = read('../../stores/shiftingLandsStore.ts')
const channel = read('../../content/channels/arcade/zuzu-shifting-lands.md')

assert.doesNotMatch(channel, /requiredRole: ADMIN/)
assert.match(channel, /route: \/play\/zuzu-shifting-lands/)
assert.doesNotMatch(channel, /navigation: false/)
assert.match(page, /v-if="!legacyMode"/)
assert.match(page, /ShiftingLandsJourneyBoard/)
assert.match(page, /@legacy="legacyMode = true"/)
assert.match(page, /legacyMode = false/)
assert.equal(existsSync(file('../../pages/play/zuzu-shifting-lands.vue')), true)
assert.match(
  read('../../pages/admin/zuzu-shifting-lands.vue'),
  /redirectCode: 301/,
)

assert.match(board, /<FlipCard\b/)
assert.match(board, /<kr-card-flip/)
assert.match(board, /encounter-back\.svg/)
assert.match(board, /trial-back\.svg/)
assert.match(board, /v-for="option in openChoices"/)
assert.match(board, /v-for="option in lockedChoices"/)
assert.match(board, /game\.activeEncounter\?\.choices/)
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

assert.match(store, /restoreJourneyLedgerV9\(JSON\.parse\(saved\)\)/)
assert.match(store, /restoreJourneyLedgerV8\(JSON\.parse\(savedV8\)\)/)
assert.match(store, /restoreJourneyLedgerV7\(JSON\.parse\(savedV7\)\)/)
assert.match(store, /restoreJourneyLedgerV6\(JSON\.parse\(savedV6\)\)/)
assert.match(store, /restoreJourneyLedgerV5\(JSON\.parse\(savedV5\)\)/)
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
assert.match(store, /stepJourneyLedgerV5\(active, action as JourneyActionV5\)/)
assert.match(store, /stepJourneyLedgerV6\(active, action as JourneyActionV6\)/)
assert.match(store, /stepJourneyLedgerV7\(active, action as JourneyActionV7\)/)
assert.match(store, /const SAVE_KEY = 'kr\.shiftingLands\.journeyLedger\.v9'/)
assert.match(
  store,
  /const LEGACY_V8_SAVE_KEY = 'kr\.shiftingLands\.journeyLedger\.v8'/,
)
assert.match(
  store,
  /const LEGACY_V7_SAVE_KEY = 'kr\.shiftingLands\.journeyLedger\.v7'/,
)
assert.match(
  store,
  /const LEGACY_V6_SAVE_KEY = 'kr\.shiftingLands\.journeyLedger\.v6'/,
)
assert.match(
  store,
  /const LEGACY_V5_SAVE_KEY = 'kr\.shiftingLands\.journeyLedger\.v5'/,
)
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
assert.match(
  store,
  /const key =\s+ledger\.value\.version === 9\s+\? SAVE_KEY\s+: ledger\.value\.version === 8\s+\? LEGACY_V8_SAVE_KEY\s+: ledger\.value\.version === 7\s+\? LEGACY_V7_SAVE_KEY\s+: ledger\.value\.version === 6/,
)
assert.match(store, /if \(savedV7 !== null\) \{/)
assert.match(store, /if \(savedV6 !== null\) \{/)
assert.match(store, /if \(savedV3 !== null\) \{/)
assert.match(board, /game\.prepareTrial\(\)/)
assert.match(board, /trialSuccessPercent\(choice\)/)
assert.match(board, /Requires two earned mercy or honesty marks/)
assert.match(board, /game\.findCard\(/)
assert.match(store, /v6Card\(id\) \?\? findFiveLandCard\(id\)/)
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

// Silas, 2026-10-16 layout sweep: one toolbar row under the site header (no
// second title), tabs inline, and road cards two by two on portrait screens.
// Silas, 2026-11-01: one header strip site-wide, so that row docks into the
// shell's system bar; the board measures its own width for the wide layout.
const toolbar = board.slice(
  board.indexOf('<header-page-bar'),
  board.indexOf('</header-page-bar>'),
)
assert.ok(toolbar.length > 0, 'the toolbar row docks into the system bar')
assert.doesNotMatch(
  toolbar,
  /<h1[\s>]/,
  'the site header already names the game',
)
assert.doesNotMatch(toolbar, /order-last/, 'tabs stay on the toolbar row')
assert.match(toolbar, /role="tablist"[\s\S]*aria-label="Journey views"/)
assert.doesNotMatch(board, /class="kr-toolbar/, 'no second header strip')
assert.match(
  board,
  /v-show="!\(item\.value === 'road' && wideBoard\)"/,
  'the Road tab hides when the board shows road and side panel together',
)
assert.match(board, /@media \(orientation: portrait\)[\s\S]*?\.road-grid/)

console.log(
  'Shifting Lands playable board contract passed: safe card reveals, five-land controls, real reducer integration, legacy save isolation and inspectable history',
)
