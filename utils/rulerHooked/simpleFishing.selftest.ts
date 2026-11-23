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
let snapped = hooked
for (let beat = 0; beat < 8; beat++) {
  snapped = applySimpleReel(snapped, 'TAP')
}
assert.equal(
  snapped.stage,
  'ESCAPED',
  'reckless reeling still has an understandable consequence',
)
assert.equal(applySimpleReel(snapped, 'RELEASE'), snapped)

const dangerousFinalPull = {
  ...hooked,
  progress: 95,
  tension: 95,
}
const snappedOnLanding = applySimpleReel(dangerousFinalPull, 'TAP')
assert.equal(snappedOnLanding.progress, 100)
assert.equal(snappedOnLanding.tension, 100)
assert.equal(
  snappedOnLanding.stage,
  'ESCAPED',
  'a line that snaps on the same tap as 100% progress cannot award a fish',
)
assert.equal(
  applySimpleReel(snappedOnLanding, 'TAP'),
  snappedOnLanding,
  'rapid tapping after escape never grants a late catch',
)
assert.equal(
  applySimpleFishingStop(snappedOnLanding, 50),
  snappedOnLanding,
  'terminal inputs do not restart the same catch',
)
assert.equal(
  applySimpleReel(landed, 'RELEASE'),
  landed,
  'slack after landing cannot mutate the final record',
)

const beforeHook = applySimpleFishingStop(start, Number.NaN)
assert.deepEqual(beforeHook.stops, [0])
assert.equal(beforeHook.stage, 'HOOK')
const badHook = applySimpleFishingStop(beforeHook, Number.POSITIVE_INFINITY)
assert.deepEqual(
  badHook.stops,
  [0, 0],
  'invalid stop positions are normalized before recording',
)
assert.equal(badHook.stage, 'REEL')
assert.equal(
  applySimpleFishingStop(badHook, 50),
  badHook,
  'a double hook tap cannot reset the reel progress',
)

let idleRelease = badHook
for (let beat = 0; beat < 100; beat++) {
  idleRelease = applySimpleReel(idleRelease, 'RELEASE')
}
assert.equal(idleRelease.progress, 0)
assert.equal(idleRelease.tension, 0)
assert.equal(idleRelease.stage, 'REEL')
assert.equal(idleRelease.actions.length, 100)

for (let seed = 0; seed < 24; seed++) {
  const run = createRun(bundle, {
    saveId: `new-angler-${seed}`,
    name: 'New Angler',
    seed: `new-angler-${seed}`,
    rulerName: 'Mo',
    stamp: 'T0',
  })
  let fight = applySimpleFishingStop(
    applySimpleFishingStop(startSimpleFishing(run), seed % 2 ? 100 : 0),
    seed % 2 ? 0 : 100,
  )
  for (let beat = 0; beat < 30 && !simpleFishingFinished(fight); beat++) {
    fight = applySimpleReel(fight, fight.tension >= 65 ? 'RELEASE' : 'TAP')
  }
  assert.equal(
    fight.stage,
    'LANDED',
    `first-time player ${seed} can recover from two missed timing stops`,
  )
  assert.ok(fight.actions.includes('RELEASE'))
}

console.log('Simple two-stop and tap/release fishing self-test passed.')
