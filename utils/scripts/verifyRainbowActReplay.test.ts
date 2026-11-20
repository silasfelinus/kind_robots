import assert from 'node:assert/strict'
import { readRainbowSave } from '../arcade/games/rainbowLoadouts'
import {
  canReplayRainbowAct,
  rainbowActReplaySave,
} from '../arcade/games/rainbowActReplay'
import { emptyRainbowHangar } from '../arcade/games/rainbowHangar'
import { isRainbowCheckpoint } from '../arcade/games/rainbowPrincessPreview'

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
console.log('rainbow Act replay: ok (locks, sandbox snapshot, slot integrity)')
