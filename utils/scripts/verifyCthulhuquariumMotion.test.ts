// utils/scripts/verifyCthulhuquariumMotion.test.ts
//
// utils/cthulhuquariumMotion.ts: every fish-bible movement mode keeps its
// occupant inside the tank and does the one thing its mode promises.

import assert from 'node:assert/strict'
import {
  MODE_TUNING,
  spawnSwimState,
  startle,
  stepSwimState,
  toBehaviorMode,
  type BehaviorMode,
  type SwimEnvironment,
} from '../cthulhuquariumMotion'

const W = 640
const H = 360

function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function env(overrides: Partial<SwimEnvironment> = {}): SwimEnvironment {
  return {
    width: W,
    height: H,
    delta: 1 / 60,
    speedMultiplier: 1,
    pointer: null,
    food: null,
    random: seeded(7),
    ...overrides,
  }
}

const modes = Object.keys(MODE_TUNING) as BehaviorMode[]
for (const mode of modes) {
  const random = seeded(mode.length * 31)
  const state = spawnSwimState(mode, W, H, random)
  for (let tick = 0; tick < 60 * 120; tick += 1) {
    stepSwimState(state, env({ random }))
    assert.ok(state.x >= 0 && state.x <= W, `${mode} left the tank (x=${state.x})`)
    assert.ok(state.y >= 0 && state.y <= H, `${mode} left the tank (y=${state.y})`)
    assert.ok(Number.isFinite(state.angle), `${mode} angle went non-finite`)
  }
}
console.log(`✅ all ${modes.length} modes stay inside the tank over two minutes`)

const anchor = spawnSwimState('anchor', W, H, seeded(1))
const start = { x: anchor.x, y: anchor.y }
for (let tick = 0; tick < 600; tick += 1) stepSwimState(anchor, env())
assert.deepEqual({ x: anchor.x, y: anchor.y }, start)
assert.equal(startle(anchor, anchor.x, anchor.y), false)
console.log('✅ anchor does not move, and cannot be startled')

const lurker = spawnSwimState('lurk', W, H, seeded(2))
for (let tick = 0; tick < 60; tick += 1) stepSwimState(lurker, env())
const watched = env({ pointer: { x: lurker.x, y: lurker.y } })
for (let tick = 0; tick < 120; tick += 1) stepSwimState(lurker, watched)
const before = { x: lurker.x, y: lurker.y }
for (let tick = 0; tick < 120; tick += 1) stepSwimState(lurker, watched)
assert.ok(Math.hypot(lurker.x - before.x, lurker.y - before.y) < 1)
console.log('✅ lurk holds position while watched')

const drifter = spawnSwimState('drift', W, H, seeded(3))
drifter.x = 300
drifter.y = 180
assert.equal(startle(drifter, 290, 180), true)
assert.ok(drifter.vx > 0, 'startled away from the tap')
assert.equal(startle(drifter, 10, 10), false)
console.log('✅ a tap scatters nearby swimmers away from it')

const school = spawnSwimState('school', W, H, seeded(4))
assert.ok(school.packmates.length >= 3 && school.packmates.length <= 5)
assert.equal(spawnSwimState('drift', W, H, seeded(4)).packmates.length, 0)
console.log('✅ only schools bring packmates')

const hungry = spawnSwimState('drift', W, H, seeded(5))
hungry.x = 100
hungry.y = 200
const food = { x: 400, y: 100 }
const distance = () => Math.hypot(hungry.x - food.x, hungry.y - food.y)
const initial = distance()
for (let tick = 0; tick < 120; tick += 1) stepSwimState(hungry, env({ food }))
assert.ok(distance() < initial - 50, 'swam toward the food')
console.log('✅ swimmers path toward food')

assert.equal(toBehaviorMode('HOVER'), 'hover')
assert.equal(toBehaviorMode('something-new'), 'drift')
assert.equal(toBehaviorMode(null), 'drift')
console.log('✅ unknown behaviors fall back to drift, never to an invisible fish')
console.log('✅ verifyCthulhuquariumMotion: all assertions passed')
