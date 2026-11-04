import assert from 'node:assert/strict'
import {
  REBEL_CANNON_MAX_PRESS,
  REBEL_CANNON_MIN_PRESS,
  REBEL_CANNON_TOLERANCE,
  REBEL_DECOY_COUNT,
  REBEL_DECOY_MAX_PRESS,
  REBEL_DECOY_MIN_PRESS,
  rebelArchPosition,
  rebelCannonHit,
  rebelDecoyIsReal,
  rebelEncounterFor,
  rebelEncounterPresses,
  rebelRealDecoyIndex,
} from '../rebelEncounters'

for (let seed = 0; seed < 500; seed++) {
  const p = rebelEncounterPresses(seed)
  assert.ok(
    p.cannon >= REBEL_CANNON_MIN_PRESS && p.cannon <= REBEL_CANNON_MAX_PRESS,
  )
  assert.ok(
    p.decoys >= REBEL_DECOY_MIN_PRESS && p.decoys <= REBEL_DECOY_MAX_PRESS,
  )
  assert.equal(rebelEncounterFor(p.cannon, seed), 'cannon')
  assert.equal(rebelEncounterFor(p.decoys, seed), 'decoys')
  const arch = rebelArchPosition(seed)
  assert.ok(arch >= 15 && arch <= 85)
  assert.ok(rebelCannonHit(arch, seed))
  assert.ok(rebelCannonHit(arch + REBEL_CANNON_TOLERANCE, seed))
  assert.ok(!rebelCannonHit(arch + REBEL_CANNON_TOLERANCE + 1, seed))
  const real = rebelRealDecoyIndex(seed)
  assert.ok(real >= 0 && real < REBEL_DECOY_COUNT)
  let realCount = 0
  for (let i = 0; i < REBEL_DECOY_COUNT; i++) {
    if (rebelDecoyIsReal(i, seed)) realCount++
  }
  assert.equal(realCount, 1)
}

for (let press = 0; press <= REBEL_CANNON_MIN_PRESS - 1; press++) {
  assert.equal(rebelEncounterFor(press, 5), null)
}
assert.equal(rebelEncounterFor(100, 5), null)
assert.deepEqual(rebelEncounterPresses(9), rebelEncounterPresses(9))
console.log('rebel encounters: ok')
