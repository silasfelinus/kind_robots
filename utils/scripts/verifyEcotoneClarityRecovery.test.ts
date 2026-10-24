import assert from 'node:assert/strict'
import {
  chooseSubstanceMoment,
  createRun,
  restoreRun,
  type RunState,
} from '../ecotone/engine'
import { SUBSTANCE_CHOICES, type SubstanceId } from '../ecotone/substanceArc'
import type { LensId } from '../ecotone/content'

// Clarity recovery: every opening lens can step back to sober clarity by
// voluntarily pausing, and a mid-recovery save restores identically.
const OPENINGS: LensId[] = ['sober', 'tipsy', 'stoned', 'tripping_balls']
const CARDS = ['WH-003', 'WH-004', 'WH-005', 'WH-006', 'WH-007', 'WH-008']

function at(opening: LensId, card: string): RunState {
  return {
    ...createRun(211, 'reporter'),
    phase: 'beat',
    event: 'green-ribbon',
    card,
    openingState: opening,
    currentState: opening,
  }
}

for (const opening of OPENINGS) {
  for (const { id } of SUBSTANCE_CHOICES) {
    const used = chooseSubstanceMoment(at(opening, CARDS[0]!), [
      id as SubstanceId,
    ])
    assert.ok(used.clarity <= 3, `${opening}/${id} clarity stays bounded`)
    const paused = chooseSubstanceMoment({ ...used, card: CARDS[1]! }, [])
    assert.equal(
      paused.currentState,
      'sober',
      `${opening}/${id} pause is sober`,
    )
    assert.ok(
      paused.clarity >= used.clarity,
      `${opening}/${id} a pause never lowers clarity`,
    )
    assert.equal(paused.openingState, opening, 'opening lens is immutable')
    assert.deepEqual(
      restoreRun(JSON.parse(JSON.stringify(paused))),
      paused,
      `${opening}/${id} save/reload is deterministic`,
    )
  }
}

// Worst case: sustained drinking bottoms out, then two pauses fully recover.
let run = at('sober', CARDS[0]!)
for (const card of CARDS.slice(0, 5))
  run = chooseSubstanceMoment({ ...run, card }, ['alcohol'])
assert.equal(run.clarity, 0)
const stepOne = chooseSubstanceMoment({ ...run, card: CARDS[5]! }, [])
assert.equal(stepOne.clarity, 2)
const midSave = restoreRun(JSON.parse(JSON.stringify(stepOne)))
assert.deepEqual(midSave, stepOne, 'mid-recovery save restores identically')
const stepTwo = chooseSubstanceMoment({ ...midSave, card: 'WH-009' }, [])
assert.equal(stepTwo.clarity, 3, 'recovery completes after a reload')

console.log('Ecotone clarity recovery passed')
