import assert from 'node:assert/strict'
import { readRainbowSave } from '../arcade/games/rainbowLoadouts'
import {
  canReplayRainbowAct,
  rainbowActReplaySave,
} from '../arcade/games/rainbowActReplay'
import { emptyRainbowHangar } from '../arcade/games/rainbowHangar'
import { rainbowFlightComms } from '../arcade/games/rainbowFlightComms'
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
    trenchRoute: 'vault' as const,
    routeSettled: true,
    rescuedCourier: true,
    wreckRoute: 'depot' as const,
    wreckSettled: true,
    podsSaved: 4,
    reefRoute: 'relay' as const,
    reefSettled: true,
    pylonsDown: 3,
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
  assert.equal(instance.snapshot.medals[5], undefined)
  assert.equal(instance.save, undefined)
  assert.deepEqual(instance.mastered, [])
}
console.log('rainbow Act replay: ok (locks, sandbox and 1/4 seat flight)')
