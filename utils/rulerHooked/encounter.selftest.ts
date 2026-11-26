// utils/rulerHooked/encounter.selftest.ts
// Headless behavioral coverage for the beat-based fishing reducer.

import assert from 'node:assert/strict'
import { RULER_HOOKED_CONTENT as C } from './content'
import { createRun } from './newGame'
import { advanceAfterFishingAttempt, eligibleEnding, takeTurn } from './loop'
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
import { fightAim, fightTargetFor, resolveTimingStop, timingProfileFor } from './timingBar'
import { cloneSave, resolveChoice } from './applyEffects'
import {
  CASTS_PER_DAY,
  DAILY_EVENTS,
  PROCLAMATION_COUNTER,
  PROCLAMATION_EVENT_INDEX_COUNTER,
  hearProclamation,
} from './dailyEvents'
import { fishAtLocation, resolveFishingCatch } from './fish'
import { GEAR_CATALOG, purchaseGearFor } from './economy'

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

// Invalid timing events must not consume a beat or poison deterministic history.
{
  for (const slug of ['parlour-rustfish', 'sunspoke-koi', 'moebius-crab']) {
    const start = startFishingEncounterForFish(fresh(), slug)
    for (const position of [NaN, Infinity, -Infinity]) {
      assert.equal(applyFishingStop(start, position), start)
    }
    assert.deepEqual(applyFishingStop(start, -50), applyFishingStop(start, 0))
    assert.deepEqual(applyFishingStop(start, 150), applyFishingStop(start, 100))
  }
}

// The last cast of a day still receives that day's crier bonus. Before this
// fix the reward was rolled after incrementing the day, unlike the preview.
{
  const eventIndex = DAILY_EVENTS.findIndex((event) =>
    event.fishBoostSlugs?.includes('orchardjaw-perch'),
  )
  assert.ok(eventIndex >= 0)
  let witnesses = 0
  for (let i = 0; i < 256; i++) {
    const save = fresh()
    save.seed = `day-boundary-${i}`
    save.turnCount = CASTS_PER_DAY - 1
    save.kingdomHealth.joy = 70
    save.kingdomHealth.nature = 70
    save.flags.newlywedsGarden = true
    save.fishingRegion = 'near_bank'
    assert.ok(
      fishAtLocation(save, 'near_bank').some(
        (fish) => fish.slug === 'orchardjaw-perch',
      ),
      'the crier must boost a fish in the selected waters',
    )
    save.counters[PROCLAMATION_COUNTER] = 1
    save.counters[PROCLAMATION_EVENT_INDEX_COUNTER] = eventIndex
    const fishSeed = `${save.seed}:${save.turnCount}:fish`
    const preview = startFishingEncounter(save)
    const expected = resolveFishingCatch(cloneSave(save), makeRng(fishSeed))
    const expired = cloneSave(save)
    expired.turnCount += 1
    const oldReward = resolveFishingCatch(expired, makeRng(fishSeed))
    if (oldReward.fishSlug !== preview.fishSlug) witnesses += 1
    const result = takeTurn(C, save, makeRng('boundary-narrative'))
    assert.deepEqual(result.catch, expected, save.seed)
    assert.equal(result.catch.fishSlug, preview.fishSlug)
    assert.equal(result.save.turnCount, CASTS_PER_DAY)
    assert.equal(
      result.save.fishopedia[result.catch.fishSlug]!.firstCaughtTurn,
      CASTS_PER_DAY,
    )
    assert.equal(save.counters.fishCaught, 0)
  }
  assert.ok(witnesses > 0, 'the old day-boundary mismatch must be exercised')
}

function playHighlighted(
  start: FishingEncounter,
  reckless: boolean,
): FishingEncounter {
  let fight = start
  while (!fishingEncounterFinished(fight)) {
    const target = fightTargetFor(timingProfileFor(fight), fightAim(fight))
    const position = reckless ? 0 : target.start + target.width / 2
    fight = applyFishingStop(fight, position)
    assert.ok(fight.beat <= fight.maxBeats)
  }
  return fight
}

// Exercise the actual highlighted-input loop, day proclamations, earned
// purchases and authored petitions over repeatable multi-day reigns.
{
  let catches = 0
  let escapes = 0
  let attempts = 0
  for (let seed = 0; seed < 12; seed++) {
    let save = fresh()
    save.seed = `guided-reign-${seed}`
    for (let turn = 0; turn < 60 && save.status === 'ACTIVE'; turn++) {
      save = hearProclamation(save)
      for (const gear of GEAR_CATALOG) {
        const before = save
        save = purchaseGearFor(save, gear.id)
        if (save !== before) {
          assert.equal(
            save.counters.coins,
            (before.counters.coins ?? 0) - gear.cost,
          )
          assert.ok(save.counters.coins! >= 0)
        }
      }
      const start = startFishingEncounter(save)
      const reckless = turn % 7 === 6
      const fight = playHighlighted(start, reckless)
      assert.deepEqual(playHighlighted(start, reckless), fight)
      const narrativeSeed = `${save.seed}:${save.turnCount}`
      const before = save
      attempts++
      if (fight.phase === 'LANDED') {
        catches++
        const result = takeTurn(C, save, makeRng(narrativeSeed))
        assert.equal(result.catch.fishSlug, start.fishSlug)
        assert.equal(
          result.save.counters.fishCaught,
          (before.counters.fishCaught ?? 0) + 1,
        )
        assert.equal(
          result.save.counters.coins ?? 0,
          (before.counters.coins ?? 0) + result.catch.coinsFound,
        )
        save = result.save
        if (result.card?.choices.length) {
          const choice = result.card.choices[seed % result.card.choices.length]!
          save = resolveChoice(save, result.card, choice)
          save.counters.cardsResolved = (save.counters.cardsResolved ?? 0) + 1
        }
      } else {
        escapes++
        const result = advanceAfterFishingAttempt(C, save, makeRng(narrativeSeed))
        assert.deepEqual(result.save.fishopedia, before.fishopedia)
        assert.equal(result.save.counters.fishCaught, before.counters.fishCaught)
        assert.equal(result.save.counters.coins, before.counters.coins)
        save = result.save
        if (result.card?.choices.length) {
          const choice = result.card.choices[seed % result.card.choices.length]!
          save = resolveChoice(save, result.card, choice)
          save.counters.cardsResolved = (save.counters.cardsResolved ?? 0) + 1
        }
      }
      assert.equal(save.turnCount, before.turnCount + 1)
      if (eligibleEnding(C, save)) break
    }
  }
  assert.equal(catches + escapes, attempts)
  assert.ok(catches > 0 && escapes > 0)
  console.log({ attempts, catches, escapes })
}

// A first-time angler following the highlighted targets can be a little
// early or late without snapping every common line. The offsets are fixed
// percentage points of the bar, not frame counts or a perfect timing bot.
{
  let landed = 0
  let missed = 0
  for (let i = 0; i < 128; i++) {
    const save = fresh()
    save.seed = `novice-${i}`
    const start = startFishingEncounterForFish(save, 'parlour-rustfish')
    let current = start
    while (!fishingEncounterFinished(current)) {
      const profile = timingProfileFor(current)
      const target = fightTargetFor(profile, fightAim(current))
      const error = current.beat % 2 === 0 ? -3 : 3
      current = applyFishingStop(
        current,
        target.start + target.width / 2 + error,
      )
      assert.ok(current.beat <= current.maxBeats)
    }
    if (current.phase === 'LANDED') landed++

    let reckless = start
    while (!fishingEncounterFinished(reckless)) {
      reckless = applyFishingStop(reckless, 0)
    }
    if (reckless.phase === 'ESCAPED') missed++
  }
  assert.ok(landed >= 120, `Common beginner catches: ${landed}/128`)
  assert.equal(missed, 128, 'A complete miss never earns a free fish')
  console.log(`Common beginner catches: ${landed}/128`)
}

console.log('ruler-hooked ENCOUNTER self-test: ALL PASS')
