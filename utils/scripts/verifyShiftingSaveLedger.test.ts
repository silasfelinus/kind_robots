import assert from 'node:assert/strict'
import {
  activeAuthoredEncounter,
  newAuthoredJourney,
  stepAuthoredJourney,
} from '../shiftingLands/authoredJourney'
import { reachableLocations } from '../shiftingLands/journey'
import { journeyCharacterSheet } from '../shiftingLands/progression'
import {
  migrateJourneyLedger,
  newJourneyLedger,
  replayJourneyLedger,
  restoreJourneyLedger,
  stepJourneyLedger,
  type JourneyLedger,
} from '../shiftingLands/saveLedger'

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const start = newJourneyLedger(20261011)
assert.equal(start.version, 3)
assert.equal(start.seed, start.current.journey.seed)
assert.equal(start.legacyCheckpoint, null)
assert.deepEqual(restoreJourneyLedger(json(start)), start)
assert.deepEqual(newJourneyLedger(20261011), start)

const first = reachableLocations(start.current.journey)[0]!
const traveled = stepJourneyLedger(start, { type: 'TRAVEL', locationId: first })
assert.notStrictEqual(traveled, start)
assert.equal(traveled.actions.length, 1)
assert.ok(traveled.current.drawn[first])
const card = activeAuthoredEncounter(traveled.current)!
const choice = card.choices[0]!
const chosen = stepJourneyLedger(traveled, {
  type: 'CHOOSE',
  choiceId: choice.id,
})
assert.equal(chosen.current.outcomes.length, 1)
assert.equal(chosen.actions.length, 2)
assert.deepEqual(restoreJourneyLedger(json(chosen)), chosen)
assert.deepEqual(replayJourneyLedger(json(chosen)), chosen)
assert.strictEqual(
  stepJourneyLedger(chosen, { type: 'CHOOSE', choiceId: choice.id }),
  chosen,
  'double-tapped choice is not another dice roll',
)
assert.deepEqual(
  replayJourneyLedger(json(chosen))!.current.outcomes[0]!.roll.dice,
  chosen.current.outcomes[0]!.roll.dice,
  'refresh replays both dice, not just success/failure',
)
assert.deepEqual(
  replayJourneyLedger(json(chosen))!.current.journey.layouts,
  chosen.current.journey.layouts,
  'land shifts and routes are recovered exactly',
)

assert.equal(restoreJourneyLedger({ ...chosen, version: 4 }), null)
assert.equal(restoreJourneyLedger({ ...chosen, actions: null }), null)
assert.equal(
  restoreJourneyLedger({ ...chosen, manifestBlobSha: 'corrupt' }),
  null,
)
assert.equal(restoreJourneyLedger({ ...chosen, packSha: 'corrupt' }), null)
assert.equal(restoreJourneyLedger({ ...chosen, seed: 2 }), null)
assert.equal(
  restoreJourneyLedger({
    ...chosen,
    actions: [...chosen.actions, chosen.actions[1]],
  }),
  null,
  'illegal duplicate choice in action history is rejected',
)
assert.equal(
  restoreJourneyLedger({
    ...chosen,
    actions: [{ type: 'TRAVEL', locationId: 'invented' }, chosen.actions[1]],
  }),
  null,
  'invented locations cannot be replayed',
)
assert.equal(
  restoreJourneyLedger({
    ...chosen,
    current: {
      ...chosen.current,
      outcomes: [
        {
          ...chosen.current.outcomes[0]!,
          roll: { ...chosen.current.outcomes[0]!.roll, dice: [7, 0] },
        },
      ],
    },
  }),
  null,
  'forged dice reject the whole save',
)
assert.equal(
  restoreJourneyLedger({
    ...chosen,
    current: {
      ...chosen.current,
      drawn: { ...chosen.current.drawn, [first]: 'fake-card' },
    },
  }),
  null,
  'authored card identity is pinned',
)
assert.equal(
  restoreJourneyLedger({
    ...chosen,
    current: {
      ...chosen.current,
      journey: { ...chosen.current.journey, hp: 8 },
    },
    usedRewards: ['fake-item'],
  }),
  null,
)
assert.equal(
  restoreJourneyLedger({ ...chosen, legacyCheckpoint: { fake: 'data' } }),
  null,
)
assert.equal(
  restoreJourneyLedger({
    ...chosen,
    actions: Array(1201).fill(chosen.actions[0]),
  }),
  null,
)
assert.deepEqual(
  restoreJourneyLedger(json(chosen)),
  chosen,
  'bad saves cannot poison a good replay',
)

const legacyFresh = newAuthoredJourney(31)
const legacyRoute = reachableLocations(legacyFresh.journey)[0]!
const legacyOpen = stepAuthoredJourney(legacyFresh, {
  type: 'TRAVEL',
  locationId: legacyRoute,
})
const legacyCard = activeAuthoredEncounter(legacyOpen)!
const legacyResolved = stepAuthoredJourney(legacyOpen, {
  type: 'CHOOSE',
  choiceId: legacyCard.choices[0]!.id,
})
const migrated = migrateJourneyLedger(json(legacyResolved))!
assert.ok(migrated)
assert.deepEqual(migrated.legacyCheckpoint, legacyResolved)
assert.deepEqual(migrated.current, legacyResolved)
assert.deepEqual(migrated.actions, [])
assert.deepEqual(restoreJourneyLedger(json(migrated)), migrated)
assert.deepEqual(
  migrated.current.outcomes[0]!.roll.dice,
  legacyResolved.outcomes[0]!.roll.dice,
  'legacy dice must not be re-rolled or rescaled',
)
assert.equal(migrateJourneyLedger({ ...legacyResolved, packSha: 'fake' }), null)
assert.equal(migrateJourneyLedger({ ...legacyResolved, version: 17 }), null)
const legacyNext = reachableLocations(migrated.current.journey).find(
  (id) =>
    !migrated.current.journey.resolved.some(
      (result) => result.locationId === id,
    ),
)
if (legacyNext) {
  const resumed = stepJourneyLedger(migrated, {
    type: 'TRAVEL',
    locationId: legacyNext,
  })
  assert.notStrictEqual(resumed, migrated)
  assert.deepEqual(restoreJourneyLedger(json(resumed)), resumed)
  assert.deepEqual(resumed.legacyCheckpoint, legacyResolved)
}

let rewarded: JourneyLedger | null = null
for (let seed = 1; seed <= 1200 && !rewarded; seed++) {
  const fresh = newJourneyLedger(seed)
  for (const id of reachableLocations(fresh.current.journey)) {
    const opened = stepJourneyLedger(fresh, { type: 'TRAVEL', locationId: id })
    if (activeAuthoredEncounter(opened.current)?.id !== 'scarecrows-lantern')
      continue
    const outcome = stepJourneyLedger(opened, {
      type: 'CHOOSE',
      choiceId: 'cut-the-line',
    })
    if (outcome.current.outcomes[0]?.roll.success) {
      rewarded = outcome
      break
    }
  }
}
assert.ok(
  rewarded,
  'an authored ration reward should be earnable with a seeded run',
)
const sheet = journeyCharacterSheet(rewarded!.current, rewarded!.usedRewards)
assert.ok(
  sheet.inventory.some(
    (item) => item.id === 'recovered-rations' && item.available,
  ),
)
const spent = stepJourneyLedger(rewarded!, {
  type: 'USE_REWARD',
  rewardId: 'recovered-rations',
})
assert.notStrictEqual(spent, rewarded)
assert.deepEqual(spent.usedRewards, ['recovered-rations'])
assert.equal(
  spent.current.journey.provisions,
  rewarded!.current.journey.provisions + 2,
)
assert.equal(spent.current.journey.turn, rewarded!.current.journey.turn + 1)
assert.equal(
  journeyCharacterSheet(spent.current, spent.usedRewards).inventory[0]
    ?.available,
  false,
)
assert.deepEqual(restoreJourneyLedger(json(spent)), spent)
assert.strictEqual(
  stepJourneyLedger(spent, {
    type: 'USE_REWARD',
    rewardId: 'recovered-rations',
  }),
  spent,
  'already spent reward is never consumed twice',
)
assert.strictEqual(
  stepJourneyLedger(spent, { type: 'USE_REWARD', rewardId: 'ribbon-evidence' }),
  spent,
  'evidence may not be used as a consumable',
)
assert.equal(
  restoreJourneyLedger({ ...spent, usedRewards: [] }),
  null,
  'reward-use ledger must match the reconstructed resource state',
)
assert.equal(
  restoreJourneyLedger({ ...spent, current: rewarded!.current }),
  null,
  'reward use cannot be removed while leaving its event behind',
)
assert.equal(
  restoreJourneyLedger({
    ...spent,
    actions: [
      ...spent.actions,
      { type: 'USE_REWARD', rewardId: 'recovered-rations' },
    ],
  }),
  null,
  'used items cannot be replayed twice',
)

console.log(
  'Shifting Lands V3 ledger passed: seed replay, deterministic dice and map, V2 migration, reward spending, tamper rejection, idempotence',
)
