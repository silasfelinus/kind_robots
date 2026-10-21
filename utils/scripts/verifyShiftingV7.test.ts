import assert from 'node:assert/strict'
import { JOURNEY_WORLD, reachableLocations } from '../shiftingLands/journey'
import {
  activeV6Card,
  choiceLock,
  type V6Choice,
} from '../shiftingLands/deckV6'
import {
  newJourneyLedgerV6,
  restoreJourneyLedgerV6,
} from '../shiftingLands/saveLedgerV6'
import {
  newJourneyLedgerV7,
  stepJourneyLedgerV7,
  restoreJourneyLedgerV7,
  type JourneyLedgerV7,
} from '../shiftingLands/saveLedgerV7'
import {
  trialForLandV7,
  canChooseTrialV7,
  canPrepareTrialV7,
  TRIAL_RULES_V7,
} from '../shiftingLands/trialRulesV7'
import { balanceReportV6 } from './shiftingLandsV6BalanceReport'

const POLICIES = ['kind', 'safe', 'greedy', 'ruthless', 'random'] as const
type Policy = (typeof POLICIES)[number]
const BONUS: Record<string, number> = {
  steel: 3, awareness: 2, wits: 2, bearing: 2, resolve: 2, insight: 2,
}
const perPolicy = process.argv[2] === undefined ? 300 : Number(process.argv[2])
assert.ok(Number.isSafeInteger(perPolicy) && perPolicy >= 1 && perPolicy <= 5000)
assert.equal(TRIAL_RULES_V7, 1)
const legacy = newJourneyLedgerV6(42)
assert.deepEqual(restoreJourneyLedgerV6(JSON.parse(JSON.stringify(legacy))), legacy)
assert.equal(restoreJourneyLedgerV7(legacy), null, 'never misread V6 as V7')
assert.equal(restoreJourneyLedgerV6(newJourneyLedgerV7(42)), null)
for (const land of JOURNEY_WORLD.lands) {
  const trial = trialForLandV7(land.id)!
  assert.deepEqual(
    trial.choices.map((choice) => choice.id),
    ['confront', 'parley', 'evidence', 'witness', 'scout'],
  )
}
const initial = newJourneyLedgerV7(55)
assert.equal(stepJourneyLedgerV7(initial, { type: 'PREPARE' }), initial)
assert.equal(restoreJourneyLedgerV7({ ...initial, trialRulesVersion: 0 }), null)

function chance(choice: V6Choice) {
  if (!choice.roll) return 1
  const modifier = BONUS[choice.roll.skill]! + choice.roll.modifier
  let pass = 0
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++)
      if (a + b + modifier >= choice.roll.target) pass++
  return pass / 36
}
const expected = (choice: V6Choice, key: 'hp_delta' | 'provisions_delta') =>
  chance(choice) * choice.success[key] +
  (1 - chance(choice)) * (choice.failure?.[key] ?? 0)
const mark = (choice: V6Choice, key: string) =>
  chance(choice) * ((choice.success.marks as Record<string, number> | undefined)?.[key] ?? 0) +
  (1 - chance(choice)) * ((choice.failure?.marks as Record<string, number> | undefined)?.[key] ?? 0)
function random(seed: number, step: number, size: number): number {
  return ((Math.imul(seed ^ (step + 1), 1664525) + 1013904223) >>> 0) % size
}
function encounterPick(
  choices: V6Choice[], policy: Policy, seed: number, step: number,
): V6Choice {
  if (policy === 'random') return choices[random(seed, step, choices.length)]!
  const score = (choice: V6Choice) => {
    const hp = expected(choice, 'hp_delta') + (choice.cost?.hp ?? 0)
    const food = expected(choice, 'provisions_delta') +
      (choice.cost?.provisions ?? 0)
    const mercy = mark(choice, 'mercy')
    const honest = mark(choice, 'honesty')
    const cunning = mark(choice, 'cunning')
    const ruthless = mark(choice, 'ruthlessness')
    if (policy === 'kind')
      return mercy * 7 + honest * 3 - ruthless * 7 + hp * 1.5 + food * 0.6
    if (policy === 'safe') return hp * 7 + food * 1.3 + chance(choice) * 2
    if (policy === 'greedy') return food * 7 + hp * 1.4 + cunning
    return ruthless * 8 + cunning * 2 + food * 1.8 - mercy * 5 + hp
  }
  return [...choices].sort((a, b) => score(b) - score(a))[0]!
}
type Row = {
  policy: Policy
  completed: number
  fallen: number
  stalled: number
  reached: number[]
  diedByLand: number[]
  witnessEligible: number
  scoutEligible: number
  witnessTaken: number
  scoutTaken: number
  prepared: number
  uniquePreparations: number
}
function simulate(policy: Policy, runs: number): Row {
  const row: Row = {
    policy, completed: 0, fallen: 0, stalled: 0,
    reached: Array(5).fill(0) as number[],
    diedByLand: Array(5).fill(0) as number[],
    witnessEligible: 0, scoutEligible: 0,
    witnessTaken: 0, scoutTaken: 0, prepared: 0, uniquePreparations: 0,
  }
  for (let seed = 1; seed <= runs; seed++) {
    let ledger: JourneyLedgerV7 = newJourneyLedgerV7(seed)
    const entered = new Set<number>()
    let stalled = false
    for (let step = 0; step < 120; step++) {
      const state = ledger.current
      const journey = state.journey
      if (journey.phase === 'complete' || journey.phase === 'fallen') break
      const index = journey.landIndex
      if (!entered.has(index)) {
        entered.add(index)
        row.reached[index] = row.reached[index]! + 1
      }
      let next: JourneyLedgerV7
      if (journey.phase === 'boss') {
        const land = JOURNEY_WORLD.lands[index]!
        const trial = trialForLandV7(land.id)!
        const available = trial.choices.filter((choice) =>
          canChooseTrialV7(choice, state, ledger.prepared),
        )
        if (available.some((item) => item.id === 'witness')) row.witnessEligible++
        if (available.some((item) => item.id === 'scout')) row.scoutEligible++
        // Scarce food never buys compassion, and a cautious player is willing
        // to trade a measured point of health for a mapped alternate route.
        if (
          (policy === 'kind' || policy === 'safe') &&
          index >= 3 &&
          journey.hp >= 4 &&
          canPrepareTrialV7(state, ledger.prepared) &&
          (policy === 'safe' || !available.some((item) => item.id === 'witness'))
        ) {
          next = stepJourneyLedgerV7(ledger, { type: 'PREPARE' })
          row.prepared++
          row.uniquePreparations++
        } else {
          assert.ok(available.length)
          let id: string
          if (policy === 'kind') {
            id = (available.find((item) => item.id === 'witness') ??
              available.find((item) => item.id === 'scout') ??
              available.find((item) => item.id === 'evidence') ??
              available.find((item) => item.id === 'parley') ??
              available[0]!).id
          } else if (policy === 'safe') {
            id = (available.find((item) => item.id === 'scout') ??
              [...available].sort((a, b) =>
                (a.target - BONUS[a.skill]! + a.cost * 0.75) -
                (b.target - BONUS[b.skill]! + b.cost * 0.75))[0]!).id
          } else if (policy === 'random') {
            id = available[random(seed, step, available.length)]!.id
          } else {
            id = (available.find((item) => item.id === 'confront') ??
              available[0]!).id
          }
          if (id === 'witness') row.witnessTaken++
          if (id === 'scout') row.scoutTaken++
          next = stepJourneyLedgerV7(ledger, { type: 'TRIAL', choiceId: id })
        }
      } else if (!journey.active) {
        const open = reachableLocations(journey).filter((id) =>
          !journey.resolved.some((result) => result.locationId === id),
        )
        if (!open.length) { stalled = true; break }
        next = stepJourneyLedgerV7(ledger, {
          type: 'TRAVEL', locationId: open[0]!,
        })
      } else {
        const card = activeV6Card(state)!
        const open = card.choices.filter((choice) => !choiceLock(state, choice))
        assert.ok(open.length)
        const chosen = encounterPick(open, policy, seed, step)
        next = stepJourneyLedgerV7(ledger, { type: 'CHOOSE', choiceId: chosen.id })
      }
      assert.notEqual(next, ledger, 'a legal choice changes the ledger')
      ledger = next
    }
    const phase = ledger.current.journey.phase
    if (phase === 'complete') row.completed++
    else if (phase === 'fallen') {
      row.fallen++
      const index = ledger.current.journey.landIndex
      row.diedByLand[index] = row.diedByLand[index]! + 1
    } else {
      assert.ok(stalled, 'increase simulation turn cap if necessary')
      row.stalled++
    }
    if (seed <= 20) {
      const restored = restoreJourneyLedgerV7(JSON.parse(JSON.stringify(ledger)))
      assert.deepEqual(restored, ledger, 'new V7 saves exactly replay')
      const forged = JSON.parse(JSON.stringify(ledger))
      forged.current.marks.mercy += 5
      assert.equal(restoreJourneyLedgerV7(forged), null, 'cannot forge mercy')
      if (ledger.prepared.length) {
        const erased = JSON.parse(JSON.stringify(ledger))
        erased.prepared = []
        assert.equal(restoreJourneyLedgerV7(erased), null, 'cannot forge scout status')
      }
    }
  }
  assert.equal(row.completed + row.fallen + row.stalled, runs)
  return row
}

const rows = POLICIES.map((policy) => simulate(policy, perPolicy))
const old = balanceReportV6(perPolicy)
const pct = (n: number, d: number) => (100 * n / d).toFixed(1) + '%'
const lines = [
  '# V7 Shifting Lands balance comparison',
  '',
  'Both rule versions use identical seed ranges and encounter-choice preferences. ' +
    'V7 kindness selects earned witnesses, while V7 cautious play surveys harder trials once at a health cost. ' +
    'These are heuristics, not human playtesting.',
  '',
  '| Policy | V6 complete | V7 complete | V7 fallen | V7 witness uses | V7 scout uses | V7 preparations |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...rows.map((row, i) =>
    '| ' + row.policy + ' | ' + pct(old[i]!.completed, perPolicy) +
    ' | ' + pct(row.completed, perPolicy) + ' | ' +
    pct(row.fallen, perPolicy) + ' | ' + row.witnessTaken +
    ' | ' + row.scoutTaken + ' | ' + row.prepared + ' |',
  ),
  '',
  '## V7 reachability by land, percent of all runs',
  '',
  '| Policy | ' + JOURNEY_WORLD.lands.map((land) => land.id).join(' | ') + ' |',
  '| --- | ---: | ---: | ---: | ---: | ---: |',
  ...rows.map((row) =>
    '| ' + row.policy + ' | ' + row.reached.map((count) =>
      pct(count, perPolicy)).join(' | ') + ' |',
  ),
  '',
  '## V7 deaths by land, counts',
  '',
  '| Policy | ' + JOURNEY_WORLD.lands.map((land) => land.id).join(' | ') + ' |',
  '| --- | ---: | ---: | ---: | ---: | ---: |',
  ...rows.map((row) =>
    '| ' + row.policy + ' | ' + row.diedByLand.join(' | ') + ' |',
  ),
  '',
  'New witness/scout routes remain earned. Each scout action consumes one HP and is recorded in save replay. ' +
    'V6 saves and trial difficulty are unchanged; V7 is a separate save version.',
]
console.log('BEGIN SHIFTING V7 BALANCE REPORT')
console.log(lines.join('\n'))
console.log('END SHIFTING V7 BALANCE REPORT')
assert.ok(rows.every((row) => row.stalled === 0))
assert.ok(rows.find((row) => row.policy === 'kind')!.witnessTaken > 0)
assert.ok(rows.find((row) => row.policy === 'safe')!.scoutTaken > 0)
