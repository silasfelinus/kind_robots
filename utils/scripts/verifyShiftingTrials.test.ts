import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  AUTHORED_TRIALS,
  TRIAL_SOURCE_VERSION,
  canChooseTrial,
  trialForLand,
} from '../shiftingLands/authoredBosses'
import {
  activeFiveLandEncounter,
  FIVE_LAND_CARDS,
} from '../shiftingLands/authoredFiveLands'
import { JOURNEY_WORLD, reachableLocations } from '../shiftingLands/journey'
import {
  newJourneyLedgerV4,
  restoreJourneyLedgerV4,
} from '../shiftingLands/saveLedgerV4'
import {
  newJourneyLedgerV5,
  restoreJourneyLedgerV5,
  stepJourneyLedgerV5,
  TRIAL_SOURCE_SHA,
  type JourneyLedgerV5,
} from '../shiftingLands/saveLedgerV5'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const rawBossSource = readFileSync(
  file('../shiftingLands/authoredTrials.json'),
  'utf8',
)
const bossSource = JSON.parse(rawBossSource)
const trialRules = createHash('sha1')
  .update(
    JSON.stringify(
      bossSource.trials.map(
        (trial: {
          landId: string
          choices: Array<Record<string, unknown>>
        }) => ({
          landId: trial.landId,
          choices: trial.choices.map((choice) => ({
            id: choice.id,
            skill: choice.skill,
            target: choice.target,
            cost: choice.cost,
            requiredAnyFlags: choice.requiredAnyFlags,
          })),
        }),
      ),
    ),
  )
  .digest('hex')
assert.equal(TRIAL_SOURCE_SHA, '1acc49193e828ca102483c79c038e7626ae9d325')
assert.equal(
  trialRules,
  '925b733b60d75c5d5bf812af7443bff18bb14a06',
  'V5 trial rules (choices, skills, targets, costs, clue flags) are pinned; prose may be rewritten, rules need a new save version',
)
const earnedFlags = new Set(
  FIVE_LAND_CARDS.flatMap((card) =>
    card.choices.flatMap((choice) => [
      ...choice.success.add_flags,
      ...choice.failure.add_flags,
    ]),
  ),
)
assert.equal(TRIAL_SOURCE_VERSION, 1)
assert.equal(TRIAL_SOURCE_SHA.length, 40)
assert.equal(AUTHORED_TRIALS.length, 5)
assert.deepEqual(
  new Set(AUTHORED_TRIALS.map((trial) => trial.landId)),
  new Set(JOURNEY_WORLD.lands.map((land) => land.id)),
)
for (const trial of AUTHORED_TRIALS) {
  assert.equal(trial.art, null)
  assert.ok(trial.flavor.length >= 110)
  assert.deepEqual(
    trial.choices.map((choice) => choice.id),
    ['confront', 'parley', 'evidence'],
  )
  assert.equal(new Set(trial.choices.map((choice) => choice.id)).size, 3)
  assert.ok(
    trial.choices.every(
      (choice) =>
        choice.target >= 7 &&
        choice.target <= 13 &&
        choice.success.length >= 65 &&
        choice.failure.length >= 65 &&
        choice.success !== choice.failure &&
        Number.isInteger(choice.cost) &&
        choice.cost >= 0 &&
        choice.cost <= 1,
    ),
  )
  assert.equal(trial.choices[0]!.requiredAnyFlags.length, 0)
  assert.equal(trial.choices[1]!.requiredAnyFlags.length, 0)
  assert.ok(trial.choices[2]!.requiredAnyFlags.length >= 3)
  assert.ok(
    trial.choices[2]!.requiredAnyFlags.some((flag) => earnedFlags.has(flag)),
    'evidence must be earnable from authored encounters',
  )
  assert.equal(canChooseTrial(trial.choices[2]!, [], 30), false)
  assert.equal(
    canChooseTrial(
      trial.choices[2]!,
      [trial.choices[2]!.requiredAnyFlags[0]!],
      30,
    ),
    true,
  )
  assert.equal(canChooseTrial(trial.choices[1]!, [], 0), false)
  assert.equal(canChooseTrial(trial.choices[0]!, [], 0), true)
}
assert.equal(
  AUTHORED_TRIALS.some((trial) => 'editorialNote' in trial),
  false,
)
assert.match(bossSource.trials[0].editorialNote, /cosmic entity/)
assert.doesNotMatch(
  AUTHORED_TRIALS[0]!.flavor,
  /sacrificial rites|cosmic entity|abducting children/,
)
assert.ok(trialForLand('homestead'))
assert.equal(trialForLand('fictional-land'), null)

const initial = newJourneyLedgerV5(1011)
assert.equal(initial.version, 5)
assert.deepEqual(restoreJourneyLedgerV5(clone(initial)), initial)
const old = newJourneyLedgerV4(1011)
assert.deepEqual(restoreJourneyLedgerV4(clone(old)), old)
assert.equal(restoreJourneyLedgerV4(clone(initial)), null)
assert.equal(restoreJourneyLedgerV5(clone(old)), null)
assert.equal(restoreJourneyLedgerV5({ ...initial, trialSha: 'wrong' }), null)
assert.equal(restoreJourneyLedgerV5({ ...initial, worldSha: 'wrong' }), null)
assert.equal(
  restoreJourneyLedgerV5({ ...initial, usedRewards: ['invented'] }),
  null,
)
assert.equal(
  restoreJourneyLedgerV5({ ...initial, trialResults: [{ invented: true }] }),
  null,
)
assert.equal(
  restoreJourneyLedgerV5({
    ...initial,
    current: { ...initial.current, flags: ['invented'] },
  }),
  null,
)
assert.equal(
  restoreJourneyLedgerV5({
    ...initial,
    actions: [{ type: 'TRIAL', choiceId: 'confront' }],
  }),
  null,
)
assert.equal(
  restoreJourneyLedgerV5({
    ...initial,
    actions: [{ type: 'BOSS', approach: 'challenge' }],
  }),
  null,
)
assert.strictEqual(
  stepJourneyLedgerV5(initial, { type: 'TRIAL', choiceId: 'confront' }),
  initial,
)
assert.strictEqual(stepJourneyLedgerV5(initial, { type: 'RETREAT' }), initial)

let reachedFive = 0
let bossSuccess = 0
let bossFailure = 0
let evidenceAttempt = 0
const usedLand = new Set<string>()
for (let seed = 1; seed <= 260; seed++) {
  let ledger: JourneyLedgerV5 = newJourneyLedgerV5(seed)
  for (let move = 0; move < 160; move++) {
    const state = ledger.current.journey
    const land = JOURNEY_WORLD.lands[state.landIndex]!
    usedLand.add(land.id)
    if (
      state.phase === 'complete' ||
      state.phase === 'fallen' ||
      state.phase === 'retired'
    )
      break
    if (state.phase === 'boss') {
      const trial = trialForLand(land.id)!
      const evidence = trial.choices.find(
        (choice) =>
          choice.id === 'evidence' &&
          canChooseTrial(choice, ledger.current.flags, state.provisions),
      )
      const choice = evidence ?? trial.choices[0]!
      if (evidence) evidenceAttempt++
      const before = ledger
      const next = stepJourneyLedgerV5(before, {
        type: 'TRIAL',
        choiceId: choice.id,
      })
      assert.notStrictEqual(next, before)
      assert.equal(next.trialResults.length, before.trialResults.length + 1)
      const last = next.trialResults.at(-1)!
      assert.equal(last.landId, land.id)
      assert.equal(last.choiceId, choice.id)
      assert.equal(last.bossId, land.boss.id)
      assert.equal(last.roll.dice.length, 2)
      assert.equal(
        last.roll.total,
        last.roll.dice[0] + last.roll.dice[1] + last.roll.modifier,
      )
      assert.equal(last.roll.difficulty, choice.target)
      assert.equal(
        last.resultText,
        last.roll.success ? choice.success : choice.failure,
      )
      if (last.roll.success) {
        bossSuccess++
        assert.equal(
          next.current.journey.bosses.length,
          before.current.journey.bosses.length + 1,
        )
      } else {
        bossFailure++
        assert.equal(
          next.current.journey.bosses.length,
          before.current.journey.bosses.length,
        )
      }
      assert.strictEqual(
        stepJourneyLedgerV5(next, { type: 'TRIAL', choiceId: 'invalid' }),
        next,
      )
      ledger = next
      continue
    }
    if (state.active) {
      const encounter = activeFiveLandEncounter(ledger.current)
      assert.ok(encounter)
      const choice = [...encounter!.choices].sort(
        (a, b) =>
          a.roll.target - a.roll.modifier - b.roll.target + b.roll.modifier,
      )[0]!
      const next = stepJourneyLedgerV5(ledger, {
        type: 'CHOOSE',
        choiceId: choice.id,
      })
      assert.notStrictEqual(next, ledger)
      ledger = next
      continue
    }
    const locationId = reachableLocations(state).find(
      (id) => !state.resolved.some((entry) => entry.locationId === id),
    )
    assert.ok(locationId)
    const next = stepJourneyLedgerV5(ledger, {
      type: 'TRAVEL',
      locationId: locationId!,
    })
    assert.notStrictEqual(next, ledger)
    ledger = next
  }
  if (ledger.current.journey.phase === 'complete') {
    reachedFive++
    assert.equal(ledger.current.journey.bosses.length, 5)
    assert.equal(ledger.current.journey.resolved.length, 15)
  }
  const restored = restoreJourneyLedgerV5(clone(ledger))
  assert.deepEqual(restored, ledger)
  if (ledger.trialResults.length) {
    const corrupted = clone(ledger)
    corrupted.trialResults[0]!.roll.dice[0] = 7
    assert.equal(restoreJourneyLedgerV5(corrupted), null)
  }
  const oldWording = JSON.parse(
    JSON.stringify(ledger, (key, value) =>
      ['text', 'reason', 'resultText'].includes(key)
        ? 'Zuzu said it differently before the prose pass.'
        : value,
    ),
  )
  assert.deepEqual(
    restoreJourneyLedgerV5(oldWording),
    ledger,
    'a save written with earlier card prose restores to the current wording',
  )
}
assert.ok(bossSuccess > 60)
assert.ok(bossFailure > 30)
assert.ok(evidenceAttempt > 0, 'clue-earned trial path must be reachable')
assert.ok(
  reachedFive > 0,
  'at least one seeded expedition clears all five trials',
)
assert.deepEqual(usedLand, new Set(JOURNEY_WORLD.lands.map((land) => land.id)))
console.log(
  'Shifting Lands authored trials: five distinct bosses, clue gating, alternatives, failed/successful dice, V4 isolation and V5 replay verified',
)
