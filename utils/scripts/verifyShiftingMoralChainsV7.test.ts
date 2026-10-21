import assert from 'node:assert/strict'
import { JOURNEY_WORLD, reachableLocations } from '../shiftingLands/journey'
import {
  newJourneyLedgerV7,
  stepJourneyLedgerV7,
} from '../shiftingLands/saveLedgerV7'
import { activeV6Card, choiceLock } from '../shiftingLands/deckV6'
import { canChooseTrialV7, trialForLandV7 } from '../shiftingLands/trialRulesV7'
import {
  MORAL_CHAIN_PAIRS,
  moralChainsV7,
} from '../shiftingLands/moralChainsV7'
import { worldEchoesV7 } from '../shiftingLands/worldEchoesV7'
import type { TrialResult } from '../shiftingLands/authoredBosses'

assert.equal(MORAL_CHAIN_PAIRS.length, 18)
assert.equal(new Set(MORAL_CHAIN_PAIRS).size, 18)
const start = newJourneyLedgerV7(304).current
const lands = JOURNEY_WORLD.lands
const passed = (id: string, turn: number, choiceId: string): TrialResult => {
  const land = lands.find((entry) => entry.id === id)!
  const roll = {
    landId: id,
    locationId: land.boss.id,
    skill: 'steel' as const,
    dice: [5, 5] as [number, number],
    modifier: 3,
    difficulty: 10,
    total: 13,
    success: true,
  }
  return {
    landId: id,
    bossId: land.boss.id,
    choiceId,
    turn,
    roll,
    resultText: 'A verified completed trial.',
    hpChange: 0,
    provisionChange: 0,
  }
}

for (const key of MORAL_CHAIN_PAIRS) {
  const [landId, pair] = key.split(':')
  const [firstId, secondId] = pair!.split('/')
  const index = lands.findIndex((land) => land.id === landId)
  assert.ok(index >= 2)
  const earlier = lands[index - 2]!
  const previous = lands[index - 1]!
  const first = passed(earlier.id, 11, firstId!)
  const second = passed(previous.id, 23, secondId!)
  const bosses = [first, second].map((result) => ({
    landId: result.landId,
    id: result.bossId,
    turn: result.turn,
    approach: 'challenge' as const,
    roll: result.roll,
  }))
  const state = {
    ...start,
    journey: {
      ...start.journey,
      landIndex: index,
      phase: 'explore' as const,
      bosses,
    },
  }
  const scenes = moralChainsV7(state, [first, second])
  assert.equal(scenes.length, 1, key + ' resolves a unique pair')
  assert.ok(scenes[0]!.title.length > 8 && scenes[0]!.text.length >= 110)
  assert.equal(scenes[0]!.landId, landId)
  assert.equal(scenes[0]!.sourceTurn, 23)
  assert.deepEqual(moralChainsV7(state, [first, second]), scenes)
  assert.equal(
    moralChainsV7(
      { ...state, journey: { ...state.journey, landIndex: index - 1 } },
      [first, second],
    ).length,
    0,
    'future chapter must not appear early',
  )
  assert.deepEqual(
    moralChainsV7(state, [
      { ...first, roll: { ...first.roll, success: false } },
      second,
    ]),
    [],
  )
  assert.deepEqual(moralChainsV7(state, [first, { ...second, turn: 22 }]), [])
  assert.deepEqual(
    moralChainsV7(
      { ...state, journey: { ...state.journey, bosses: [bosses[0]!] } },
      [first, second],
    ),
    [],
  )
  assert.deepEqual(
    moralChainsV7(state, [first, { ...second, choiceId: 'nonexistent' }]),
    [],
  )
  assert.ok(
    worldEchoesV7(state, [first, second]).some(
      (echo) => echo.id === scenes[0]!.id,
    ),
  )
  assert.deepEqual(start, newJourneyLedgerV7(304).current)
}

// The real reducer is exercised, too. These are fixed bots, not human test
// rates: the point is confirming that several compounded paths actually
// occur in seeded expeditions, not asserting that every rare path is common.
type Policy = 'kind' | 'greedy' | 'ruthless' | 'random'
const seen = new Map<string, number>()
let journeys = 0
const pickRandom = (seed: number, step: number, length: number) =>
  ((Math.imul(seed + step, 1664525) + 1013904223) >>> 0) % length

for (const policy of ['kind', 'greedy', 'ruthless', 'random'] as Policy[]) {
  for (let seed = 1; seed <= 250; seed++) {
    let ledger = newJourneyLedgerV7(seed)
    for (let step = 0; step < 110; step++) {
      const journey = ledger.current.journey
      if (
        journey.phase === 'complete' ||
        journey.phase === 'fallen' ||
        journey.phase === 'retired'
      )
        break
      if (journey.phase === 'boss') {
        const land = lands[journey.landIndex]!
        const choices = trialForLandV7(land.id)!.choices.filter((choice) =>
          canChooseTrialV7(choice, ledger.current, ledger.prepared),
        )
        const preferred =
          policy === 'kind'
            ? ['solidarity', 'witness', 'evidence', 'parley', 'confront']
            : policy === 'greedy'
              ? ['tribute', 'coerce', 'parley', 'confront']
              : policy === 'ruthless'
                ? ['coerce', 'tribute', 'confront']
                : []
        const candidate =
          policy === 'random'
            ? choices[pickRandom(seed, step, choices.length)]!
            : (choices.find((item) => preferred.includes(item.id)) ??
              choices[0]!)
        ledger = stepJourneyLedgerV7(ledger, {
          type: 'TRIAL',
          choiceId: candidate.id,
        })
      } else if (!journey.active) {
        const road = reachableLocations(journey).find(
          (locationId) =>
            !journey.resolved.some((visit) => visit.locationId === locationId),
        )
        if (!road) break
        ledger = stepJourneyLedgerV7(ledger, {
          type: 'TRAVEL',
          locationId: road,
        })
      } else {
        const card = activeV6Card(ledger.current)!
        const options = card.choices.filter(
          (choice) => !choiceLock(ledger.current, choice),
        )
        let choice
        if (policy === 'random') {
          choice = options[pickRandom(seed, step, options.length)]!
        } else {
          const score = (entry: (typeof options)[number]) => {
            const marks = entry.success.marks
            const food =
              entry.success.provisions_delta + (entry.cost?.provisions ?? 0)
            if (policy === 'kind')
              return (
                (marks?.mercy ?? 0) * 8 +
                (marks?.honesty ?? 0) * 4 -
                (marks?.ruthlessness ?? 0) * 8
              )
            if (policy === 'greedy') return food * 8
            return (marks?.ruthlessness ?? 0) * 8 + food
          }
          choice = [...options].sort((a, b) => score(b) - score(a))[0]!
        }
        ledger = stepJourneyLedgerV7(ledger, {
          type: 'CHOOSE',
          choiceId: choice.id,
        })
      }
    }
    journeys++
    for (const scene of moralChainsV7(ledger.current, ledger.trialResults))
      seen.set(scene.id, (seen.get(scene.id) ?? 0) + 1)
  }
}
assert.ok(
  seen.size >= 2,
  'multiple authored combinations occur under real seeded gameplay',
)
assert.ok([...seen].some(([id]) => id.includes('tribute-tribute')))
assert.ok([...seen].some(([id]) => id.includes('coerce-coerce')))
console.log(
  'V7 moral chains passed: ' +
    MORAL_CHAIN_PAIRS.length +
    ' distinct paired scenes, true boss/result matching, no future spoilers, ' +
    journeys +
    ' real-reducer seeded journeys, ' +
    seen.size +
    ' observed chain identities; ' +
    [...seen.entries()].map(([id, count]) => id + '=' + count).join(', '),
)
