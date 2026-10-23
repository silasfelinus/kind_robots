import assert from 'node:assert/strict'
import { RULER_HOOKED_CONTENT as bundle } from './content'
import { createRun } from './newGame'
import {
  applySimpleFishingStop,
  applySimpleReel,
  simpleFishingFinished,
  startSimpleFishing,
} from './simpleFishing'

const fresh = () =>
  createRun(bundle, {
    saveId: 'simple-fishing-test',
    name: 'Simple fishing',
    seed: 'tutorial-fishing-seed',
    rulerName: 'Angler',
    stamp: 'T0',
  })

const start = startSimpleFishing(fresh())
assert.equal(start.stage, 'CAST')
const hooked = applySimpleFishingStop(applySimpleFishingStop(start, 50), 50)
assert.equal(hooked.stage, 'REEL')
assert.equal(hooked.stops.length, 2)
assert.ok(hooked.progress >= 10)

let landed = hooked
for (let beat = 0; beat < 20 && !simpleFishingFinished(landed); beat++) {
  if (landed.tension >= 65) landed = applySimpleReel(landed, 'RELEASE')
  else landed = applySimpleReel(landed, 'TAP')
}
assert.equal(
  landed.stage,
  'LANDED',
  'an instructed first-time player can catch a fish',
)
assert.equal(landed.progress, 100)
assert.ok(
  landed.actions.includes('RELEASE'),
  'slack is used during a successful catch',
)

const unskilled = applySimpleFishingStop(applySimpleFishingStop(start, 0), 100)
assert.equal(unskilled.stage, 'REEL', 'timing misses do not prevent reeling')
assert.ok(unskilled.progress > 0)
let recovered = unskilled
for (let beat = 0; beat < 25 && !simpleFishingFinished(recovered); beat++) {
  recovered = applySimpleReel(
    recovered,
    recovered.tension >= 65 ? 'RELEASE' : 'TAP',
  )
}
assert.equal(
  recovered.stage,
  'LANDED',
  'a player can recover from both missed stops',
)
assert.deepEqual(
  applySimpleReel(unskilled, 'TAP'),
  applySimpleReel(unskilled, 'TAP'),
  'recorded inputs are deterministic',
)
const snapped = Array.from({ length: 8 }).reduce(
  (state) => applySimpleReel(state, 'TAP'),
  hooked,
)
assert.equal(
  snapped.stage,
  'ESCAPED',
  'reckless reeling still has an understandable consequence',
)
assert.equal(applySimpleReel(snapped, 'RELEASE'), snapped)
console.log('Simple two-stop and tap/release fishing self-test passed.')
