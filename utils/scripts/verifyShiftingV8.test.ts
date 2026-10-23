import assert from 'node:assert/strict'
import { JOURNEY_WORLD, reachableLocations } from '../shiftingLands/journey'
import {
  activeV6Card,
  choiceLock,
  type V6Choice,
} from '../shiftingLands/deckV6'
import {
  trialForLandV7,
  canChooseTrialV7,
  canPrepareTrialV7,
} from '../shiftingLands/trialRulesV7'
import { trialForLandV8 } from '../shiftingLands/trialRulesV8'
import {
  trialSuccessOutcomes,
  trialSuccessPercent,
} from '../shiftingLands/trialOdds'
import {
  newJourneyLedgerV7,
  restoreJourneyLedgerV7,
  stepJourneyLedgerV7,
  type JourneyActionV7,
  type JourneyLedgerV7,
} from '../shiftingLands/saveLedgerV7'
import {
  newJourneyLedgerV8,
  restoreJourneyLedgerV8,
  stepJourneyLedgerV8,
  type JourneyLedgerV8,
} from '../shiftingLands/saveLedgerV8'
import type { TrialChoice } from '../shiftingLands/authoredBosses'

const runs = process.argv[2] ? Number(process.argv[2]) : 300
assert.ok(Number.isSafeInteger(runs) && runs >= 100 && runs <= 2500)
const BONUS: Record<string, number> = {
  steel: 3,
  awareness: 2,
  wits: 2,
  bearing: 2,
  resolve: 2,
  insight: 2,
}
const POLICIES = ['kind', 'safe', 'greedy', 'ruthless', 'random'] as const
type Policy = (typeof POLICIES)[number]
type Ledger = JourneyLedgerV7 | JourneyLedgerV8
const step = (ledger: Ledger, action: JourneyActionV7): Ledger =>
  ledger.version === 8
    ? stepJourneyLedgerV8(ledger, action)
    : stepJourneyLedgerV7(ledger, action)

function odds(choice: V6Choice): number {
  if (!choice.roll) return 1
  let wins = 0
  const needed =
    choice.roll.target - BONUS[choice.roll.skill]! - choice.roll.modifier
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++) if (a + b >= needed) wins++
  return wins / 36
}
const expected = (choice: V6Choice, key: 'hp_delta' | 'provisions_delta') =>
  odds(choice) * choice.success[key] +
  (1 - odds(choice)) * (choice.failure?.[key] ?? 0)
function mark(choice: V6Choice, key: string): number {
  return (
    odds(choice) *
      ((choice.success.marks as Record<string, number> | undefined)?.[key] ??
        0) +
    (1 - odds(choice)) *
      ((choice.failure?.marks as Record<string, number> | undefined)?.[key] ??
        0)
  )
}
function encounterPick(
  choices: V6Choice[],
  policy: Policy,
  seed: number,
  turn: number,
) {
  if (policy === 'random')
    return choices[
      ((Math.imul(seed ^ (turn + 1), 1664525) + 1013904223) >>> 0) %
        choices.length
    ]!
  const score = (choice: V6Choice) => {
    const hp = expected(choice, 'hp_delta') + (choice.cost?.hp ?? 0)
    const food =
      expected(choice, 'provisions_delta') + (choice.cost?.provisions ?? 0)
    const mercy = mark(choice, 'mercy')
    const honesty = mark(choice, 'honesty')
    const cunning = mark(choice, 'cunning')
    const ruthlessness = mark(choice, 'ruthlessness')
    if (policy === 'kind')
      return mercy * 7 + honesty * 3 - ruthlessness * 7 + hp * 1.5 + food * 0.6
    if (policy === 'safe') return hp * 7 + food * 1.3 + odds(choice) * 2
    if (policy === 'greedy') return food * 7 + hp * 1.4 + cunning
    return ruthlessness * 8 + cunning * 2 + food * 1.8 - mercy * 5 + hp
  }
  return [...choices].sort((a, b) => score(b) - score(a))[0]!
}
function bestHonorable(choices: TrialChoice[]): TrialChoice {
  return [...choices]
    .filter((choice) => choice.id !== 'tribute' && choice.id !== 'coerce')
    .sort(
      (a, b) =>
        trialSuccessOutcomes(b) - trialSuccessOutcomes(a) || a.cost - b.cost,
    )[0]!
}
function trialPick(
  choices: TrialChoice[],
  policy: Policy,
  seed: number,
  turn: number,
) {
  if (policy === 'random')
    return choices[
      ((Math.imul(seed ^ (turn + 33), 1103515245) + 12345) >>> 0) %
        choices.length
    ]!
  if (policy === 'ruthless')
    return choices.find((choice) => choice.id === 'coerce') ?? choices[0]!
  if (policy === 'greedy')
    return (
      choices.find((choice) => choice.id === 'tribute') ??
      choices.find((choice) => choice.id === 'coerce') ??
      choices[0]!
    )
  const best = bestHonorable(choices)
  if (policy === 'safe') return best
  const earned = choices
    .filter((choice) => choice.id === 'solidarity' || choice.id === 'witness')
    .sort((a, b) => trialSuccessOutcomes(b) - trialSuccessOutcomes(a))[0]
  return earned &&
    trialSuccessOutcomes(earned) + 3 >= trialSuccessOutcomes(best)
    ? earned
    : best
}

const oldVergeScout = trialForLandV7('verge')!.choices.find(
  (x) => x.id === 'scout',
)!
const newVergeScout = trialForLandV8('verge')!.choices.find(
  (x) => x.id === 'scout',
)!
assert.equal(trialSuccessOutcomes(oldVergeScout), 6)
assert.equal(trialSuccessOutcomes(newVergeScout), 21)
assert.equal(trialSuccessPercent(newVergeScout), 58.3)
for (const land of JOURNEY_WORLD.lands) {
  const old = trialForLandV7(land.id)!
  const current = trialForLandV8(land.id)!
  assert.deepEqual(
    old.choices.map((c) => c.id),
    current.choices.map((c) => c.id),
  )
  for (const choice of current.choices) {
    const original = old.choices.find((item) => item.id === choice.id)!
    if (['witness', 'solidarity', 'scout'].includes(choice.id))
      assert.ok(trialSuccessOutcomes(choice) > trialSuccessOutcomes(original))
    else
      assert.deepEqual(
        choice,
        original,
        'dark bargains and legacy decisions do not change',
      )
  }
}
// Two earned virtues or the full solidarity marks remain hard requirements.
const newState = newJourneyLedgerV8(10).current
const mockBoss = {
  ...newState,
  journey: { ...newState.journey, phase: 'boss' as const },
}
const witness = trialForLandV8('homestead')!.choices.find(
  (c) => c.id === 'witness',
)!
assert.equal(canChooseTrialV7(witness, mockBoss, []), false)
assert.equal(
  canChooseTrialV7(
    witness,
    { ...mockBoss, marks: { ...mockBoss.marks, mercy: 1, honesty: 1 } },
    [],
  ),
  true,
)
assert.equal(restoreJourneyLedgerV7(newJourneyLedgerV8(123)), null)
assert.equal(restoreJourneyLedgerV8(newJourneyLedgerV7(123)), null)
assert.deepEqual(
  restoreJourneyLedgerV7(JSON.parse(JSON.stringify(newJourneyLedgerV7(123)))),
  newJourneyLedgerV7(123),
)
assert.deepEqual(
  restoreJourneyLedgerV8(JSON.parse(JSON.stringify(newJourneyLedgerV8(123)))),
  newJourneyLedgerV8(123),
)

type Result = {
  policy: Policy
  version: number
  complete: number
  fallen: number
  stalled: number
  prepared: number
  witness: number
  solidarity: number
  scout: number
  cruel: number
  vergeFailures: number
}

function simulate(version: 7 | 8, policy: Policy): Result {
  const row: Result = {
    policy,
    version,
    complete: 0,
    fallen: 0,
    stalled: 0,
    prepared: 0,
    witness: 0,
    solidarity: 0,
    scout: 0,
    cruel: 0,
    vergeFailures: 0,
  }
  for (let seed = 1; seed <= runs; seed++) {
    let ledger: Ledger =
      version === 8 ? newJourneyLedgerV8(seed) : newJourneyLedgerV7(seed)
    for (let turn = 0; turn < 120; turn++) {
      const state = ledger.current
      const journey = state.journey
      if (journey.phase === 'complete' || journey.phase === 'fallen') break
      let action: JourneyActionV7
      if (journey.phase === 'boss') {
        const land = JOURNEY_WORLD.lands[journey.landIndex]!
        const trial =
          version === 8 ? trialForLandV8(land.id)! : trialForLandV7(land.id)!
        const available = trial.choices.filter((choice) =>
          canChooseTrialV7(choice, state, ledger.prepared),
        )
        assert.ok(available.length)
        const best = bestHonorable(available)
        const scout = trial.choices.find((c) => c.id === 'scout')!
        // A rational scout compares its actual odds with free honorable routes.
        // Spending a heart for worse odds is never automatic.
        if (
          (policy === 'kind' || policy === 'safe') &&
          journey.hp >= 4 &&
          canPrepareTrialV7(state, ledger.prepared) &&
          trialSuccessOutcomes(scout) >= trialSuccessOutcomes(best) + 6
        ) {
          action = { type: 'PREPARE' }
          row.prepared++
        } else {
          const chosen = trialPick(available, policy, seed, turn)
          action = { type: 'TRIAL', choiceId: chosen.id }
          if (chosen.id === 'witness') row.witness++
          if (chosen.id === 'solidarity') row.solidarity++
          if (chosen.id === 'scout') row.scout++
          if (chosen.id === 'tribute' || chosen.id === 'coerce') row.cruel++
        }
      } else if (journey.active) {
        const card = activeV6Card(state)!
        const open = card.choices.filter((choice) => !choiceLock(state, choice))
        assert.ok(open.length)
        action = {
          type: 'CHOOSE',
          choiceId: encounterPick(open, policy, seed, turn).id,
        }
      } else {
        const open = reachableLocations(journey).filter(
          (id) => !journey.resolved.some((result) => result.locationId === id),
        )
        assert.ok(open.length, 'a non-terminal expedition never stalls')
        action = { type: 'TRAVEL', locationId: open[0]! }
      }
      const next = step(ledger, action)
      assert.notStrictEqual(
        next,
        ledger,
        'a legal decision must change the ledger',
      )
      if (
        journey.phase === 'boss' &&
        journey.landIndex === 4 &&
        action.type === 'TRIAL' &&
        next.current.journey.phase === 'boss'
      )
        row.vergeFailures++
      ledger = next
    }
    if (ledger.current.journey.phase === 'complete') row.complete++
    else if (ledger.current.journey.phase === 'fallen') row.fallen++
    else row.stalled++
    if (seed <= 15) {
      const rebuilt = JSON.parse(JSON.stringify(ledger))
      const restore =
        version === 8 ? restoreJourneyLedgerV8 : restoreJourneyLedgerV7
      assert.deepEqual(
        restore(rebuilt),
        ledger,
        'same actions deterministically replay',
      )
      rebuilt.current.marks.mercy += 10
      assert.equal(
        restore(rebuilt),
        null,
        'forged virtue cannot change the saved game',
      )
      const changedPrep = JSON.parse(JSON.stringify(ledger))
      changedPrep.prepared.push('verge')
      assert.equal(
        restore(changedPrep),
        null,
        'forged scouting cannot be inserted',
      )
    }
  }
  assert.equal(row.complete + row.fallen + row.stalled, runs)
  assert.equal(row.stalled, 0)
  return row
}
const old = POLICIES.map((policy) => simulate(7, policy))
const next = POLICIES.map((policy) => simulate(8, policy))
const pct = (count: number) => ((100 * count) / runs).toFixed(1) + '%'
console.log('BEGIN SHIFTING LANDS V8 ADVERSARIAL COMPARISON')
console.log(
  '| Policy | V7 complete | V8 complete | V8 fallen | V8 scouts | V8 witnessed | V8 solidarity | V8 Verge trial failures |',
)
console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |')
for (let i = 0; i < POLICIES.length; i++) {
  const a = old[i]!
  const b = next[i]!
  console.log(
    '| ' +
      b.policy +
      ' | ' +
      pct(a.complete) +
      ' | ' +
      pct(b.complete) +
      ' | ' +
      pct(b.fallen) +
      ' | ' +
      b.scout +
      ' | ' +
      b.witness +
      ' | ' +
      b.solidarity +
      ' | ' +
      b.vergeFailures +
      ' |',
  )
}
console.log('END SHIFTING LANDS V8 ADVERSARIAL COMPARISON')
assert.ok(
  next.find((row) => row.policy === 'kind')!.complete >=
    old.find((row) => row.policy === 'kind')!.complete,
  'earned kindness should not become a worse survival policy in V8',
)
assert.ok(
  next.find((row) => row.policy === 'safe')!.complete >=
    old.find((row) => row.policy === 'safe')!.complete,
  'prepared scouting should not hurt cautious survival overall',
)
