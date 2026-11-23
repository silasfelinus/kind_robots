import assert from 'node:assert/strict'
import {
  RAINBOW_ALTERNATE_ROUTES,
  rainbowRouteIntel,
  readRainbowSave,
} from '../arcade/games/rainbowLoadouts'
import {
  canReplayRainbowAct,
  canReplayRainbowAlternateRoute,
  rainbowActReplaySave,
  rainbowAlternateApproachSave,
} from '../arcade/games/rainbowActReplay'
import { emptyRainbowHangar } from '../arcade/games/rainbowHangar'
import { rainbowFlightComms } from '../arcade/games/rainbowFlightComms'
import { mirrorShoalRouteUnlocked } from '../arcade/games/rainbowMirrorShoal'
import {
  createRainbowPrincessPreview,
  isRainbowCheckpoint,
} from '../arcade/games/rainbowPrincessPreview'

const fresh = emptyRainbowHangar()
assert.equal(canReplayRainbowAct(1, null, fresh), false)
assert.equal(canReplayRainbowAct(8, null, fresh), false)
assert.equal(canReplayRainbowAct(0, null, fresh), false)
assert.equal(canReplayRainbowAct(9, null, fresh), false)
assert.equal(canReplayRainbowAct(3.5, null, fresh), false)
assert.equal(rainbowActReplaySave(3, null, fresh), null)

const awarded = {
  ...fresh,
  medals: { 3: 'gold' as const, 8: 'bronze' as const },
}
const eighth = rainbowActReplaySave(8, null, awarded)
assert.equal(eighth?.checkpoint.act, 8)
assert.equal(eighth?.checkpoint.frame, 0)
assert.equal(eighth?.checkpoint.score, 0)
assert.equal(eighth?.checkpoint.allegiance, null)
assert.deepEqual(eighth?.medals, {})
assert.ok(readRainbowSave(eighth, isRainbowCheckpoint))
assert.equal(rainbowActReplaySave(7, null, awarded), null)

const firstReplay = rainbowActReplaySave(1, null, {
  ...fresh,
  medals: { 1: 'bronze' },
})
assert.equal(firstReplay?.checkpoint.act, 1)
assert.equal(firstReplay?.checkpoint.frame, 0)
assert.equal(readRainbowSave(firstReplay, isRainbowCheckpoint), null)
const firstFlight = createRainbowPrincessPreview({
  rng: () => 0.5,
  sound: { play: () => {} },
  hiScore: 0,
  demo: false,
  rainbowReplay: firstReplay,
  selectScreen: true,
})
assert.equal(firstFlight.level, 1)
assert.equal(firstFlight.snapshot.resumeMenu, null)
assert.equal(firstFlight.snapshot.selectMenu, null)
assert.equal(firstFlight.save, undefined)

const old = {
  ...eighth!,
  checkpoint: {
    ...eighth!.checkpoint,
    act: 8 as const,
    frame: 0,
    rescuedStation: true,
    rescuedNemi: true,
    freedChoir: false,
    trenchRoute: 'vault' as const,
    routeSettled: true,
    rescuedCourier: true,
    cadetsHome: true,
    wreckRoute: 'depot' as const,
    wreckSettled: true,
    podsSaved: 4,
    reefRoute: 'relay' as const,
    reefSettled: true,
    pylonsDown: 3,
    pearlWardenOutcome: 'escaped' as const,
    actContinues: 4,
    rescuedNavigator: true,
    captivesFreed: 12,
    allegiance: 'rebel' as const,
  },
  guardians: { 1: 'defeated' as const, 5: 'defeated' as const },
  medals: { 1: 'silver' as const, 2: 'gold' as const },
  pilot: 2,
  pilots: [2, 0, 3],
}
const firstTransmission = rainbowFlightComms(null, fresh, 1)
assert.equal(firstTransmission.tag, 'FIRST LAUNCH')
assert.equal(firstTransmission.pilot, 'Maribel Rowan')
assert.equal(rainbowFlightComms(null, awarded, 2).tag, 'RETURN FLIGHT')

const recoveredStation = rainbowFlightComms(old, fresh, 1)
assert.equal(recoveredStation.tag, 'BEACON RECOVERED')
assert.equal(recoveredStation.pilot, 'Solenne Adisa')
assert.ok(recoveredStation.lilt.includes('station beacon'))
const chartedFork = rainbowFlightComms(old, fresh, 3)
assert.equal(chartedFork.tag, 'TRENCH ROUTE FOUND')
assert.ok(chartedFork.lilt.includes('vault passage'))
assert.equal(rainbowFlightComms(old, fresh, 4).tag, 'COURIER RECOVERED')
assert.equal(rainbowFlightComms(old, fresh, 5).tag, 'WRECKYARD ROUTE FOUND')
assert.equal(rainbowFlightComms(old, fresh, 6).tag, 'CROWN REEF ROUTE FOUND')
assert.equal(rainbowFlightComms(old, fresh, 7).tag, 'NAVIGATOR RECOVERED')
assert.equal(rainbowFlightComms(old, fresh, 8).tag, 'MOTHERLAND CHOICE')
const changedCrew = {
  ...old,
  pilot: 3,
  pilots: [3, 1],
}
assert.equal(rainbowFlightComms(changedCrew, fresh, 3).pilot, 'Vivi Reyes')
assert.notEqual(
  rainbowFlightComms(changedCrew, fresh, 3).pilotLine,
  chartedFork.pilotLine,
)
const otherSlotComms = rainbowFlightComms(null, fresh, 3)
assert.equal(otherSlotComms.tag, 'FIRST LAUNCH')
assert.ok(!otherSlotComms.lilt.includes('vault'))

const routeIntel = rainbowRouteIntel(old)
assert.deepEqual(
  routeIntel.map((route) => route.label),
  ['Vault passage', 'Depot passage', 'Relay passage'],
)
const nurseryClear = {
  ...old,
  checkpoint: {
    ...old.checkpoint,
    trenchRoute: 'safe' as const,
    nurseryGuardianOutcome: 'defeated' as const,
    wreckRoute: 'armory' as const,
    armoryGuardianOutcome: 'escaped' as const,
  },
}
assert.deepEqual(
  rainbowRouteIntel(nurseryClear).map((route) => route.label),
  [
    'Safe passage · Guardian defeated',
    'Armory passage · Guardian escaped',
    'Relay passage',
  ],
)
const unsettled = {
  ...nurseryClear,
  checkpoint: {
    ...nurseryClear.checkpoint,
    routeSettled: false,
    wreckSettled: false,
    reefSettled: false,
  },
}
assert.ok(rainbowRouteIntel(unsettled).every((route) => !route.discovered))
assert.ok(
  rainbowRouteIntel(unsettled).every(
    (route) => route.label === 'Route undiscovered',
  ),
)

const serialized = JSON.stringify(old)
assert.equal(canReplayRainbowAct(6, old, fresh), true)
const replay = rainbowActReplaySave(6, old, fresh)!
assert.equal(replay.checkpoint.act, 6)
assert.equal(replay.checkpoint.frame, 0)
assert.equal(replay.checkpoint.score, 0)
assert.equal(replay.checkpoint.rescuedStation, true)
assert.equal(replay.checkpoint.trenchRoute, 'vault')
assert.equal(replay.checkpoint.wreckRoute, 'depot')
assert.equal(replay.checkpoint.allegiance, 'rebel')
assert.equal(replay.checkpoint.reefRoute, null)
assert.equal(
  replay.checkpoint.freedChoir,
  false,
  'a vault-route replay never invents an earned Choir rescue',
)
assert.equal(
  replay.checkpoint.cadetsHome,
  true,
  'an Act VI replay remembers the rescued Act IV cadets',
)
assert.equal(
  replay.checkpoint.pearlWardenOutcome,
  'waiting',
  'the Act VI guardian is not pre-cleared from a future flight',
)
assert.equal(
  replay.checkpoint.actContinues,
  0,
  'an Act replay starts clean rather than inheriting old continues',
)
const seventhReplay = rainbowActReplaySave(7, old, fresh)!
assert.equal(seventhReplay.checkpoint.freedChoir, false)
assert.equal(seventhReplay.checkpoint.cadetsHome, true)
assert.equal(
  seventhReplay.checkpoint.pearlWardenOutcome,
  'escaped',
  'Act VII retains the prior Act VI guardian result',
)
assert.equal(
  seventhReplay.checkpoint.actContinues,
  0,
  'Act VII must keep clean-flight X4 eligibility after replay',
)
assert.equal(
  mirrorShoalRouteUnlocked(
    seventhReplay.checkpoint.rescuedNavigator,
    seventhReplay.checkpoint.actContinues ?? -1,
  ),
  true,
  'an honest clean replay can earn Mirror Shoal without a prior rescue',
)
assert.equal(
  mirrorShoalRouteUnlocked(
    seventhReplay.checkpoint.rescuedNavigator,
    old.checkpoint.actContinues ?? 0,
  ),
  false,
  'the source slot had spent continues and cannot earn clean-flight credit',
)
assert.equal(
  seventhReplay.checkpoint.rescuedNavigator,
  false,
  'Act VII must earn its own navigator rescue again',
)
assert.ok(readRainbowSave(seventhReplay, isRainbowCheckpoint))
const rescuedRoad = {
  ...old,
  checkpoint: {
    ...old.checkpoint,
    trenchRoute: 'safe' as const,
    freedChoir: true,
    reefRoute: 'cache' as const,
    pearlWardenOutcome: 'defeated' as const,
  },
}
const rescuedRoadReplay = rainbowActReplaySave(7, rescuedRoad, fresh)!
assert.equal(
  rescuedRoadReplay.checkpoint.freedChoir,
  true,
  'Act VII remembers a genuinely freed Choir on the prior safe route',
)
assert.equal(
  rescuedRoadReplay.checkpoint.cadetsHome,
  true,
  'Act VII remembers the independent Act IV cadets',
)
assert.equal(
  rescuedRoadReplay.checkpoint.pearlWardenOutcome,
  'defeated',
  'Act VII preserves its prior cache guardian defeat',
)
assert.ok(readRainbowSave(rescuedRoadReplay, isRainbowCheckpoint))
const earlyReplay = rainbowActReplaySave(4, old, {
  ...fresh,
  medals: { 4: 'bronze' },
})!
assert.equal(earlyReplay.checkpoint.freedChoir, false)
assert.equal(earlyReplay.checkpoint.cadetsHome, false)
assert.equal(earlyReplay.checkpoint.pearlWardenOutcome, 'waiting')
assert.equal(earlyReplay.checkpoint.actContinues, 0)
assert.ok(readRainbowSave(earlyReplay, isRainbowCheckpoint))
assert.equal(replay.checkpoint.rescuedNavigator, false)
assert.equal(replay.checkpoint.captivesFreed, 0)
assert.equal(replay.guardians[5], 'defeated')
assert.equal(replay.guardians[6], undefined)
assert.deepEqual(replay.medals, {})
assert.deepEqual(replay.pilots, [2, 0, 3])
assert.equal(JSON.stringify(old), serialized)
assert.ok(readRainbowSave(replay, isRainbowCheckpoint))
assert.equal(rainbowActReplaySave(8, old, fresh), null)
const idle = {
  held: {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
  },
  pressed: {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
  },
}
for (const seats of [1, 4]) {
  const instance = createRainbowPrincessPreview({
    rng: () => 0.5,
    sound: { play: () => {} },
    hiScore: 0,
    demo: false,
    players: seats,
    selectScreen: true,
    rainbowReplay: replay,
  })
  assert.equal(instance.level, 6)
  assert.equal(instance.snapshot.activePlayers, seats)
  assert.equal(instance.snapshot.resumeMenu, null)
  assert.equal(instance.snapshot.selectMenu, null)
  assert.equal(instance.save, undefined)
  instance.update(
    idle,
    Array.from({ length: seats }, () => idle),
  )
  assert.equal(instance.snapshot.checkpoint.act, 6)
  assert.equal(instance.snapshot.checkpoint.frame, 0)
  assert.equal(
    instance.snapshot.checkpoint.actContinues,
    0,
    'every party size starts an Act replay with no prior continues',
  )
  assert.equal(instance.snapshot.medals[5], undefined)
  assert.equal(instance.save, undefined)
  assert.deepEqual(instance.mastered, [])
}
for (const seats of [1, 4]) {
  const replayFlight = createRainbowPrincessPreview({
    rng: () => 0.5,
    sound: { play: () => {} },
    hiScore: 0,
    demo: false,
    players: seats,
    selectScreen: true,
    rainbowReplay: seventhReplay,
  })
  assert.equal(replayFlight.level, 7)
  assert.equal(replayFlight.snapshot.activePlayers, seats)
  assert.equal(replayFlight.snapshot.checkpoint.act, 7)
  assert.equal(replayFlight.snapshot.checkpoint.actContinues, 0)
  assert.equal(replayFlight.snapshot.freedChoir, false)
  assert.equal(replayFlight.snapshot.cadetsHome, true)
  replayFlight.update(
    idle,
    Array.from({ length: seats }, () => idle),
  )
  assert.equal(replayFlight.snapshot.checkpoint.act, 7)
  assert.equal(replayFlight.save, undefined)
}

// Charted detours are replayed through their genuine feeder Act, never by
// inventing a mid-flight checkpoint or borrowing another save slot's chart.
const charted = {
  ...old,
  checkpoint: {
    ...old.checkpoint,
    alternateRoutesSeen: 15,
    freedChoir: false,
    cadetsHome: false,
  },
}
assert.ok(readRainbowSave(charted, isRainbowCheckpoint))
assert.equal(canReplayRainbowAlternateRoute('X5', charted, fresh), false)
assert.equal(rainbowAlternateApproachSave('X5', charted, fresh), null)
assert.equal(
  canReplayRainbowAlternateRoute('X1', null, awarded),
  false,
  'account-wide medals never discover a route for an empty slot',
)
const chartedBefore = JSON.stringify(charted)
for (const route of RAINBOW_ALTERNATE_ROUTES) {
  assert.equal(canReplayRainbowAlternateRoute(route.id, charted, fresh), true)
  const approach = rainbowAlternateApproachSave(route.id, charted, fresh)!
  assert.equal(approach.checkpoint.act, route.fromAct)
  assert.equal(approach.checkpoint.frame, 0)
  assert.equal(approach.checkpoint.score, 0)
  assert.deepEqual(approach.medals, {})
  assert.deepEqual(approach.pilots, [2, 0, 3])
  assert.equal(
    approach.checkpoint.alternateRoutesSeen,
    undefined,
    'the approach must discover its new route in flight, not inherit completion',
  )
  assert.ok(readRainbowSave(approach, isRainbowCheckpoint))
  const otherSlot = {
    ...charted,
    checkpoint: {
      ...charted.checkpoint,
      alternateRoutesSeen: 15 ^ route.bit,
    },
  }
  assert.ok(readRainbowSave(otherSlot, isRainbowCheckpoint))
  assert.equal(
    canReplayRainbowAlternateRoute(route.id, otherSlot, fresh),
    false,
  )
  assert.equal(rainbowAlternateApproachSave(route.id, otherSlot, fresh), null)
  const incompleteApproach = {
    ...charted,
    checkpoint: { ...charted.checkpoint, act: route.fromAct },
    medals: {},
  }
  assert.equal(
    canReplayRainbowAlternateRoute(route.id, incompleteApproach, fresh),
    false,
    'a detour encounter alone cannot replay an unfinished feeder Act',
  )
  for (const seats of [1, 2, 3, 4]) {
    const flight = createRainbowPrincessPreview({
      rng: () => 0.5,
      sound: { play: () => {} },
      hiScore: 0,
      demo: false,
      players: seats,
      selectScreen: true,
      rainbowReplay: approach,
    })
    assert.equal(flight.level, route.fromAct)
    assert.equal(flight.snapshot.activePlayers, seats)
    assert.equal(flight.snapshot.resumeMenu, null)
    assert.equal(flight.save, undefined)
    flight.update(
      idle,
      Array.from({ length: seats }, () => idle),
    )
    assert.equal(flight.snapshot.checkpoint.act, route.fromAct)
    assert.equal(flight.save, undefined)
  }
}
assert.equal(
  JSON.stringify(charted),
  chartedBefore,
  'none of the four detour replays may mutate the original save slot',
)

console.log('rainbow Act replay: ok (locks, sandbox and 1/4 seat flight)')
