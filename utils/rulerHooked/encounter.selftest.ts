// utils/rulerHooked/encounter.selftest.ts
// Headless behavioral coverage for the beat-based fishing reducer.

import assert from 'node:assert/strict'
import { RULER_HOOKED_CONTENT as C } from './content'
import { createRun } from './newGame'
import { advanceAfterFishingAttempt, takeTurn } from './loop'
import { makeRng } from './seed'
import {
  applyFishingAction,
  applyFishingStop,
  fishingEncounterFinished,
  startFishingEncounter,
  startFishingEncounterForFish,
  type FishingAction,
  type FishingEncounter,
} from './encounter'
import { resolveTimingStop, timingProfileFor } from './timingBar'

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

// --- timing-bar minigame (applyFishingStop / timingBar.ts) -----------------
// Silas, 2026-09-11: "sliding animation that requires stopping in the green
// for optimal percentage chance ... visual, not text based." These cover the
// stop-position -> action/quality resolution and its replay determinism.

// 8. A stop dead-center of the REEL band resolves to REEL at quality 1, and
//    reproduces the exact same progress/tension delta applyFishingAction's
//    plain REEL path would (quality=1 must be indistinguishable from "no
//    timing bar at all" -- this is the regression guard for that contract).
{
  const start = startFishingEncounterForFish(fresh(), 'parlour-rustfish')
  const profile = timingProfileFor(start)
  const center = profile.bandStart + profile.bandWidth / 2
  const resolved = resolveTimingStop(center, profile)
  assert.equal(resolved.action, 'REEL')
  assert.ok(resolved.quality > 0.999, `expected ~1.0 quality at band center, got ${resolved.quality}`)

  const viaStop = applyFishingStop(start, center)
  const viaAction = applyFishingAction(start, 'REEL')
  assert.equal(viaStop.progress, viaAction.progress)
  assert.equal(viaStop.tension, viaAction.tension)
  assert.equal(viaStop.cue, viaAction.cue)
}

// 9. Stopping well before the band resolves to SLACK; well after it resolves
//    to WAIT -- the three-zone mapping the whole mechanic depends on.
{
  const start = startFishingEncounterForFish(fresh(), 'parlour-rustfish')
  const profile = timingProfileFor(start)
  const early = resolveTimingStop(Math.max(0, profile.bandStart - 15), profile)
  assert.equal(early.action, 'SLACK')
  const late = resolveTimingStop(Math.min(100, profile.bandStart + profile.bandWidth + 15), profile)
  assert.equal(late.action, 'WAIT')
}

// 10. Same seed + same recorded stop-position sequence reproduces exactly the
//     same encounter state -- the replay guarantee the whole redesign exists
//     to preserve ("record the player's stop positions as the input
//     sequence so a replay of the same seed and the same stops reproduces
//     the same encounter").
{
  const a0 = startFishingEncounterForFish(fresh(), 'parlour-rustfish')
  const b0 = startFishingEncounterForFish(fresh(), 'parlour-rustfish')
  const profile0 = timingProfileFor(a0)
  const center0 = profile0.bandStart + profile0.bandWidth / 2
  const stops = [center0, center0 - 40, center0, center0 + 40]
  const a = stops.reduce((state, pos) => applyFishingStop(state, pos), a0)
  const b = stops.reduce((state, pos) => applyFishingStop(state, pos), b0)
  assert.deepEqual(a, b)
  assert.ok(a.history.every((beat) => typeof beat.stopPosition === 'number'))
}

// 11. A play-through entirely via stop positions -- aiming for the REEL
//     band center when tension allows it, deliberately stopping short (the
//     SLACK zone) to manage tension otherwise, mirroring smartAction's own
//     REEL/SLACK judgement -- can still land a fish. This is the timing-bar
//     path standing in as a complete replacement for the button path, not an
//     additional layer bolted on top of it (an always-REEL strategy would
//     spike tension and escape just as it would with the old buttons; that
//     is correct game balance, not a bug in this test).
{
  let current = startFishingEncounterForFish(fresh(), 'parlour-rustfish')
  let guard = 0
  while (!fishingEncounterFinished(current) && guard < 20) {
    const profile = timingProfileFor(current)
    const wantsReel = current.reversed ? current.tension > 70 : current.tension <= 70
    const target = wantsReel
      ? profile.bandStart + profile.bandWidth / 2
      : Math.max(0, profile.bandStart - profile.bandWidth / 2)
    current = applyFishingStop(current, target)
    guard += 1
  }
  assert.equal(current.phase, 'LANDED')
}

// 12. Rarity makes the timing bar meaningfully harder, not just flavour text:
//     a LEGENDARY fish's band is narrower and its sweep faster than a COMMON
//     fish's at the same beat.
{
  const common = startFishingEncounterForFish(fresh(), 'parlour-rustfish')
  const legendary = startFishingEncounterForFish(fresh(), 'crown-of-reeds-pike')
  const commonProfile = timingProfileFor(common)
  const legendaryProfile = timingProfileFor(legendary)
  assert.ok(
    legendaryProfile.bandWidth < commonProfile.bandWidth,
    `expected a narrower band for a LEGENDARY fish (${legendaryProfile.bandWidth} < ${commonProfile.bandWidth})`,
  )
  assert.ok(
    legendaryProfile.sweepMs < commonProfile.sweepMs,
    `expected a faster sweep for a LEGENDARY fish (${legendaryProfile.sweepMs} < ${commonProfile.sweepMs})`,
  )
}

// 13. Approach-phase timing stops still respect Sunspoke Koi's patience
//     requirement -- stopping in the WAIT zone during APPROACH is what
//     actually enters the fight; SLACK/REEL-zone stops still count as
//     impatience and can still lose the fish.
{
  let koi = startFishingEncounterForFish(fresh(), 'sunspoke-koi')
  assert.equal(koi.phase, 'APPROACH')
  const profile = timingProfileFor(koi)
  koi = applyFishingStop(koi, Math.min(100, profile.bandStart + profile.bandWidth + 15))
  assert.equal(koi.phase, 'FIGHT')
  assert.equal(playSmart(koi).phase, 'LANDED')
}

console.log('ruler-hooked ENCOUNTER self-test: ALL PASS')
