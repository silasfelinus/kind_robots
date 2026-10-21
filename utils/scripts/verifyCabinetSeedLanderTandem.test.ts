// Seed Lander depth pass, slice 5 part 2 (conductor kr-arcade/t-073): the Tandem and Relay rules.
//
//   npx tsx utils/scripts/verifyCabinetSeedLanderTandem.test.ts
import assert from 'node:assert/strict'
import {
  DOUBLE_PLANT_BONUS,
  DOUBLE_PLANT_WINDOW,
  PLANT_POINTS,
  POD_BLURBS,
  POD_MODES,
  POD_NAMES,
  crewMedal,
  crewScore,
  plantScore,
  relayHolder,
  shareCargo,
} from '../arcade/seedLander/tandem'

for (const m of POD_MODES) {
  assert.ok(POD_NAMES[m].length > 0)
  assert.ok(POD_BLURBS[m].length > 0)
}

assert.equal(shareCargo([3, 4], 10), 7)
assert.equal(shareCargo([8, 8], 10), 10)
assert.equal(shareCargo([-2, 5, Number.NaN], 10), 5)
assert.equal(shareCargo([4], -1), 0)

assert.equal(plantScore(500, null), PLANT_POINTS)
assert.equal(
  plantScore(500, 500 - DOUBLE_PLANT_WINDOW),
  PLANT_POINTS + DOUBLE_PLANT_BONUS,
)
assert.equal(plantScore(500, 500 - DOUBLE_PLANT_WINDOW - 1), PLANT_POINTS)
assert.equal(plantScore(500, 600), PLANT_POINTS)

assert.deepEqual([0, 1, 2, 3, 4].map(relayHolder), [0, 1, 0, 1, 0])
assert.equal(relayHolder(-3), 0)
assert.equal(relayHolder(Number.NaN), 0)

assert.equal(crewScore([300, 450]), 750)
assert.equal(crewScore([-5, Number.NaN, 20]), 20)

assert.equal(crewMedal(1500, 1000), 'gold')
assert.equal(crewMedal(1000, 1000), 'silver')
assert.equal(crewMedal(500, 1000), 'bronze')
assert.equal(crewMedal(499, 1000), null)
assert.equal(crewMedal(10, 0), null)

console.log('seed lander tandem: ok')
