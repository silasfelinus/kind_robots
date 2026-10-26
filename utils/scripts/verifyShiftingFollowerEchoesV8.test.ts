import assert from 'node:assert/strict'
import type { TrialResult } from '../shiftingLands/authoredBosses'
import type { JourneyStateV6, V6Result } from '../shiftingLands/deckV6'
import { kitchenNoviceQuestEchoesV8 } from '../shiftingLands/followerEchoesV8'
import { JOURNEY_WORLD } from '../shiftingLands/journey'
import { newJourneyLedgerV8 } from '../shiftingLands/saveLedgerV8'

const fresh = newJourneyLedgerV8(606).current
const intro: V6Result = {
  locationId: 'wayside-refuge',
  encounterId: 'a-crust-for-the-road',
  choiceId: 'thank-with-bow',
  turn: 4,
  roll: {
    landId: 'homestead',
    locationId: 'wayside-refuge',
    dice: [5, 5],
    skill: 'bearing',
    modifier: 2,
    difficulty: 7,
    total: 12,
    success: true,
  },
  success: true,
  resultText: 'The sister shares bread and the eastern road note.',
  hpChange: 0,
  provisionChange: 2,
  flags: ['kitchen-novice-trust'],
  marks: {},
}

const boss = (landId: string, turn: number) => {
  const land = JOURNEY_WORLD.lands.find((item) => item.id === landId)!
  return {
    landId,
    id: land.boss.id,
    turn,
    approach: 'parley' as const,
    roll: {
      landId,
      locationId: land.boss.id,
      dice: [6, 6] as [number, number],
      skill: 'bearing' as const,
      modifier: 2,
      difficulty: 9,
      total: 14,
      success: true,
    },
  }
}
const first = boss('homestead', 11)
const second = boss('dustwater', 21)
const third = boss('tablelands', 31)
const trial = (
  entry: ReturnType<typeof boss>,
  choiceId: string,
): TrialResult => ({
  landId: entry.landId,
  bossId: entry.id,
  choiceId,
  turn: entry.turn,
  roll: entry.roll,
  resultText: 'The recorded trial passes.',
  hpChange: 0,
  provisionChange: 0,
})

const atLand = (
  landIndex: number,
  bosses: ReturnType<typeof boss>[],
  outcome: V6Result = intro,
): JourneyStateV6 => ({
  ...fresh,
  flags: [...outcome.flags],
  outcomes: [outcome],
  journey: {
    ...fresh.journey,
    landIndex,
    bosses,
    phase: 'explore',
  },
})

const homestead = trial(first, 'witness')
const dustwater = trial(second, 'solidarity')
const tablelands = trial(third, 'witness')
const atCrossing = atLand(1, [first])
const atCanyon = atLand(2, [first, second])
const atCave = atLand(3, [first, second, third])

assert.deepEqual(kitchenNoviceQuestEchoesV8(fresh, []), [])
assert.deepEqual(
  kitchenNoviceQuestEchoesV8(
    { ...atCrossing, outcomes: [], flags: ['kitchen-novice-trust'] },
    [homestead],
  ),
  [],
  'a bare trust flag cannot invent an encounter',
)
assert.deepEqual(
  kitchenNoviceQuestEchoesV8(
    { ...atCrossing, outcomes: [{ ...intro, locationId: 'old-well' }] },
    [homestead],
  ),
  [],
  'a different location cannot impersonate the kitchen meeting',
)
assert.deepEqual(
  kitchenNoviceQuestEchoesV8(atCrossing, [{ ...homestead, turn: 8 }]),
  [],
  'a forged boss turn does not open the quest',
)
assert.deepEqual(
  kitchenNoviceQuestEchoesV8(atCrossing, [
    { ...homestead, roll: { ...homestead.roll, success: false } },
  ]),
  [],
  'failed trials do not count as rescues',
)

const crossing = kitchenNoviceQuestEchoesV8(atCrossing, [homestead])
assert.equal(crossing.length, 1)
assert.equal(crossing[0]!.landId, 'dustwater')
assert.equal(crossing[0]!.sourceTurn, intro.turn)
assert.equal(crossing[0]!.source, 'encounter')
assert.match(crossing[0]!.text, /she stays to find the families/)
assert.equal(
  kitchenNoviceQuestEchoesV8(atCrossing, [trial(first, 'coerce')])[0]!.title,
  'A closed book at the ferry',
  'a coercive first trial cannot receive the trusted-witness callback',
)

const wary: V6Result = {
  ...intro,
  roll: { ...intro.roll!, dice: [1, 1], total: 4, success: false },
  success: false,
  flags: ['kitchen-novice-wary'],
}
assert.equal(
  kitchenNoviceQuestEchoesV8(atLand(1, [first], wary), [homestead])[0]!.title,
  'The kitchen sister keeps her distance',
  'failed introduction never grants a trusted companion',
)

const canyon = kitchenNoviceQuestEchoesV8(atCanyon, [homestead, dustwater])
assert.equal(canyon.length, 2)
assert.equal(canyon[1]!.landId, 'tablelands')
assert.equal(canyon[1]!.sourceTurn, second.turn)
assert.match(canyon[1]!.text, /two missing families/)
assert.equal(
  kitchenNoviceQuestEchoesV8(atCanyon, [
    homestead,
    trial(second, 'tribute'),
  ])[1]!.title,
  'The lantern goes the other way',
  'a purchased river passage has a departure consequence',
)

const cave = kitchenNoviceQuestEchoesV8(atCave, [
  homestead,
  dustwater,
  tablelands,
])
assert.equal(cave.length, 3)
assert.equal(cave[2]!.landId, 'cave')
assert.match(cave[2]!.text, /ally by choice/)
assert.equal(
  kitchenNoviceQuestEchoesV8(atCave, [
    homestead,
    dustwater,
    trial(third, 'coerce'),
  ])[2]!.title,
  'An ally you cannot command',
)
assert.deepEqual(
  kitchenNoviceQuestEchoesV8(atCave, [homestead, dustwater]),
  canyon,
  'an uncompleted third trial never reveals the cave resolution',
)
assert.deepEqual(
  kitchenNoviceQuestEchoesV8(atCave, [homestead, dustwater, tablelands]),
  cave,
  'the same replay-verified history always projects identical prose',
)
assert.deepEqual(
  fresh,
  newJourneyLedgerV8(606).current,
  'the quest projection never mutates the saved reducer state',
)
assert.ok(cave.every((echo) => echo.text.length >= 120))

console.log(
  'Shifting Lands kitchen novice arc passed: three earned beats, trust/estrangement/reconciliation branches, forged-source rejection and deterministic projection',
)
