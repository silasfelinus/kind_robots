// utils/rulerHooked/encounter.selftest.ts
// Headless behavioral coverage for the beat-based fishing reducer.

import assert from 'node:assert/strict'
import { RULER_HOOKED_CONTENT as C } from './content'
import { createRun } from './newGame'
import { advanceAfterFishingAttempt, takeTurn } from './loop'
import { makeRng } from './seed'
import {
  applyFishingAction,
  fishingEncounterFinished,
  startFishingEncounter,
  startFishingEncounterForFish,
  type FishingAction,
  type FishingEncounter,
} from './encounter'

const fresh = () => createRun(C, {
  saveId: 'encounter-test',
  name: 'Encounter Test',
  seed: 'encounter-seed',
  rulerName: 'Mo',
  honorific: 'Ruler',
  stamp: 'T0',
})

function smartAction(encounter: FishingEncounter): FishingAction {
  if (encounter.phase === 'APPROACH') return 'WAIT'
  if (encounter.reversed) return encounter.tension > 70 ? 'REEL' : 'SLACK'
  return encounter.tension > 70 ? 'SLACK' : 'REEL'
}

function playSmart(encounter: FishingEncounter): FishingEncounter {
  let current = encounter
  while (!fishingEncounterFinished(current)) {
    current = applyFishingAction(current, smartAction(current))
  }
  return current
}

// 1. Baseline Rustfish is a real tension-management encounter and can be landed.
{
  const start = startFishingEncounterForFish(fresh(), 'parlour-rustfish')
  assert.equal(start.family, 'STANDARD_TENSION')
  assert.equal(start.phase, 'FIGHT')
  const end = playSmart(start)
  assert.equal(end.phase, 'LANDED')
  assert.ok(end.history.length >= 3)
}

// 2. Same seed + same action sequence reproduces exactly the same encounter state.
{
  const a0 = startFishingEncounterForFish(fresh(), 'parlour-rustfish')
  const b0 = startFishingEncounterForFish(fresh(), 'parlour-rustfish')
  const actions: FishingAction[] = ['REEL', 'REEL', 'SLACK', 'REEL']
  const a = actions.reduce((state, action) => applyFishingAction(state, action), a0)
  const b = actions.reduce((state, action) => applyFishingAction(state, action), b0)
  assert.deepEqual(a, b)
}

// 3. Sunspoke Koi requires explicit patience; giving line is not equivalent to waiting.
{
  let koi = startFishingEncounterForFish(fresh(), 'sunspoke-koi')
  assert.equal(koi.family, 'PATIENCE')
  assert.equal(koi.phase, 'APPROACH')
  koi = applyFishingAction(koi, 'SLACK')
  assert.equal(koi.phase, 'APPROACH')
  koi = applyFishingAction(koi, 'WAIT')
  assert.equal(koi.phase, 'FIGHT')
  assert.equal(playSmart(koi).phase, 'LANDED')
}

// 4. Three impatient Sunspoke inputs lose the fish before the fight even begins.
{
  let koi = startFishingEncounterForFish(fresh(), 'sunspoke-koi')
  koi = applyFishingAction(koi, 'REEL')
  koi = applyFishingAction(koi, 'REEL')
  koi = applyFishingAction(koi, 'REEL')
  assert.equal(koi.phase, 'ESCAPED')
}

// 5. Moebius Crab visibly reverses controls after two fight beats.
{
  let crab = startFishingEncounterForFish(fresh(), 'moebius-crab')
  assert.equal(crab.family, 'REVERSE_CONTROL')
  crab = applyFishingAction(crab, 'REEL')
  crab = applyFishingAction(crab, 'SLACK')
  assert.equal(crab.reversed, true)
  const before = crab.progress
  crab = applyFishingAction(crab, 'SLACK')
  assert.ok(crab.progress > before, 'SLACK gains line while controls are reversed')
  assert.equal(playSmart(crab).phase, 'LANDED')
}

// 6. An escaped attempt advances governance without inventing a catch.
{
  const save = fresh()
  const result = advanceAfterFishingAttempt(C, save, makeRng('narrative'))
  assert.equal(result.save.turnCount, 1)
  assert.equal(result.save.counters.fishCaught ?? 0, 0)
  assert.deepEqual(result.save.fishopedia, {})
}

// 7. The encounter preview and successful compatibility turn resolve the same species.
{
  const save = fresh()
  const encounter = startFishingEncounter(save)
  const turn = takeTurn(C, save, makeRng('narrative'))
  assert.equal(encounter.fishSlug, turn.catch.fishSlug)
}

console.log('ruler-hooked ENCOUNTER self-test: ALL PASS')
