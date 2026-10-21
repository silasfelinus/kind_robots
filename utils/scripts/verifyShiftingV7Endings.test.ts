import assert from 'node:assert/strict'
import { newJourneyLedgerV7 } from '../shiftingLands/saveLedgerV7'
import { authoredEndingV7 } from '../shiftingLands/endingsV7'
import { authoredEndingV6 } from '../shiftingLands/endingsV6'
import {
  MORAL_CONSTELLATION_IDS_V7,
  moralConstellationEndingV7,
  verifiedSuccessfulRoutesV7,
} from '../shiftingLands/endingsConstellationsV7'
import { trialForLandV7 } from '../shiftingLands/trialRulesV7'
import { JOURNEY_WORLD, type JourneyRoll } from '../shiftingLands/journey'
import type { TrialResult } from '../shiftingLands/authoredBosses'
import type { JourneyStateV6 } from '../shiftingLands/deckV6'

const BONUSES: Record<string, number> = {
  steel: 3, awareness: 2, wits: 2, bearing: 2, resolve: 2, insight: 2,
}
const roads = JOURNEY_WORLD.lands

function record(index: number, choiceId: string): {
  boss: JourneyStateV6['journey']['bosses'][number]
  result: TrialResult
} {
  const land = roads[index]!
  const trial = trialForLandV7(land.id)!
  const choice = trial.choices.find((value) => value.id === choiceId)
  assert.ok(choice, land.id + '/' + choiceId + ' exists')
  const modifier = BONUSES[choice.skill]!
  const roll: JourneyRoll = {
    landId: land.id,
    locationId: land.boss.id,
    dice: [6, 6],
    skill: choice.skill,
    modifier,
    difficulty: choice.target,
    total: 12 + modifier,
    success: 12 + modifier >= choice.target,
  }
  assert.equal(roll.success, true, 'fixture should pass its trial')
  const turn = index * 10 + 8
  return {
    boss: {
      landId: land.id,
      id: land.boss.id,
      turn,
      approach: choiceId === 'confront' ? 'challenge' : 'parley',
      roll,
    },
    result: {
      landId: land.id,
      bossId: land.boss.id,
      choiceId,
      turn,
      roll,
      resultText: 'Earned result',
      hpChange: 0,
      provisionChange: 0,
    },
  }
}

function story(
  approaches: string[],
  opts: {
    mercy?: number
    honesty?: number
    phase?: 'complete' | 'fallen' | 'retired'
    landIndex?: number
  } = {},
) {
  const records = approaches.map((name, i) => record(i, name))
  const first = newJourneyLedgerV7(129).current
  const state: JourneyStateV6 = {
    ...first,
    marks: {
      ...first.marks,
      mercy: opts.mercy ?? 0,
      honesty: opts.honesty ?? 0,
    },
    journey: {
      ...first.journey,
      landIndex: opts.landIndex ?? (opts.phase === 'fallen' ? approaches.length - 1 : 4),
      phase: opts.phase ?? 'complete',
      bosses: records.map((item) => item.boss),
    },
  }
  const trials = records.map((item) => item.result)
  return { state, trials }
}

function title(approaches: string[], opts: Parameters<typeof story>[1] = {}) {
  const { state, trials } = story(approaches, opts)
  return authoredEndingV7(state, trials)
}

assert.deepEqual([...MORAL_CONSTELLATION_IDS_V7].sort(), [
  'coercion', 'commons', 'mixed-dominion', 'public-record',
  'restitution', 'tribute', 'wayfinders',
].sort())

assert.equal(
  title(['solidarity', 'solidarity', 'witness'], { mercy: 4, honesty: 2 })?.title,
  'The Lantern Commons',
  'two collective victories and a confirmed witness build rare hopeful institutions',
)
assert.equal(
  title(['witness', 'witness', 'evidence'], { honesty: 3 })?.title,
  'The Book Nobody Owns',
)
assert.equal(
  title(['scout', 'scout', 'evidence'], { mercy: 2 })?.title,
  'A Ford With No Toll',
)
assert.equal(
  title(['tribute', 'tribute', 'tribute'])?.title,
  'The Franchise of Hunger',
)
assert.equal(
  title(['coerce', 'coerce', 'coerce'])?.title,
  'The Province of Empty Hands',
)
assert.equal(
  title(['tribute', 'coerce'])?.title,
  'The Market of Silence',
)
assert.equal(
  title(['coerce', 'tribute', 'solidarity'], { mercy: 4, honesty: 2 })?.title,
  'A Bridge Without Forgiveness',
)
assert.match(
  title(['coerce', 'tribute', 'solidarity'], { mercy: 4, honesty: 2 })!
    .paragraphs.at(-1)!,
  /No one owes you absolution/,
  'late kindness cannot magically cancel exploitation',
)

const fallen = story(['solidarity', 'solidarity', 'witness'], {
  mercy: 4, honesty: 2, phase: 'fallen', landIndex: 2,
})
assert.match(authoredEndingV7(fallen.state, fallen.trials)!.paragraphs.at(-1)!, /never see/)
const retired = story(['coerce', 'coerce', 'coerce'], { phase: 'retired' })
assert.match(authoredEndingV7(retired.state, retired.trials)!.paragraphs.at(-1)!, /common room/)

// Negative controls: fabricated successes cannot be mistaken for earned deeds.
const clean = story(['witness', 'witness', 'evidence'], { honesty: 4 })
const badTrial = structuredClone(clean.trials)
badTrial[1]!.choiceId = 'coerce'
assert.equal(verifiedSuccessfulRoutesV7(clean.state, badTrial).length, 2)
assert.notEqual(
  authoredEndingV7(clean.state, badTrial)?.title, 'The Book Nobody Owns',
  'an incompatible skill/target forged as cruelty invalidates that testimony',
)
const fakeBoss = {
  ...clean.state,
  journey: { ...clean.state.journey, bosses: [] },
}
assert.deepEqual(verifiedSuccessfulRoutesV7(fakeBoss, clean.trials), [])
assert.notEqual(authoredEndingV7(fakeBoss, clean.trials)?.title, 'The Book Nobody Owns')

const unreachable = story(['solidarity', 'solidarity', 'witness'], {
  mercy: 4, honesty: 2, phase: 'fallen', landIndex: 1,
})
assert.equal(verifiedSuccessfulRoutesV7(unreachable.state, unreachable.trials).length, 2)
assert.notEqual(
  authoredEndingV7(unreachable.state, unreachable.trials)?.title,
  'The Lantern Commons',
  'future-land events cannot turn a fallen run into a brighter ending',
)

const wrongRoll = structuredClone(clean.trials)
wrongRoll[0]!.roll.dice[0] = 1
assert.equal(verifiedSuccessfulRoutesV7(clean.state, wrongRoll).length, 2)
const duplicate = story(['coerce', 'coerce', 'coerce'])
duplicate.state.journey.bosses.push(
  structuredClone(duplicate.state.journey.bosses[0]!),
)
assert.equal(verifiedSuccessfulRoutesV7(duplicate.state, duplicate.trials).length, 3)

const wouldBeCommons = story(['solidarity', 'solidarity', 'witness'], {
  mercy: 4, honesty: 2,
})
const tainted = [
  ...wouldBeCommons.trials,
  { ...record(4, 'tribute').result, roll: { ...record(4, 'tribute').result.roll, success: false } },
]
assert.notEqual(
  authoredEndingV7(wouldBeCommons.state, tainted)?.title,
  'The Lantern Commons',
  'even failed attempted exploitation blocks a pristine utopia',
)
assert.equal(
  authoredEndingV7(
    { ...wouldBeCommons.state, journey: { ...wouldBeCommons.state.journey, phase: 'boss' } },
    wouldBeCommons.trials,
  ),
  null,
  'never foreshadow terminal outcomes',
)
assert.deepEqual(
  authoredEndingV6(clean.state, clean.trials),
  authoredEndingV6(clean.state, clean.trials),
  'V6 epilogues remain pure and unmodified',
)
const plain = authoredEndingV6(clean.state, clean.trials)!
assert.equal(
  moralConstellationEndingV7(plain, clean.state, []),
  plain,
  'no valid earned trials means no special epilogue',
)
console.log('Shifting Lands V7 moral constellations passed: seven distinct finales with three phase texts each, grounded successful trial checks, original V6 unaffected')
