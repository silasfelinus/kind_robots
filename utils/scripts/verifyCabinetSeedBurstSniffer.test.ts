// Seed Burst depth pass, slice 1 (conductor kr-arcade/t-136, depth-pass CABINETS.md section 24):
// the sniffer gnat follows the nearest gardener at junctions and joins from round 2.
//
//   npx tsx utils/scripts/verifyCabinetSeedBurstSniffer.test.ts
import assert from 'node:assert/strict'
import {
  SNIFFER_MAX,
  SNIFF_CHANCE,
  nearestScent,
  sniffStep,
  snifferCount,
  tileDistance,
} from '../arcade/seedBurst/sniffer'

assert.equal(snifferCount(1, 3), 0, 'no sniffers in round 1')
assert.equal(snifferCount(2, 4), 1)
assert.equal(snifferCount(5, 6), 2)
assert.equal(snifferCount(8, 9), 3)
assert.equal(snifferCount(30, 10), SNIFFER_MAX, 'capped')
assert.equal(snifferCount(2, 1), 0, 'always leaves one ordinary gnat')

assert.equal(tileDistance({ x: 1, y: 1 }, { x: 4, y: 3 }), 5)
const near = { x: 3, y: 1 }
assert.deepEqual(nearestScent({ x: 1, y: 1 }, [{ x: 13, y: 11 }, near]), near)
assert.equal(nearestScent({ x: 1, y: 1 }, []), null)

const up = { dx: 0, dy: -1 }
const right = { dx: 1, dy: 0 }
const down = { dx: 0, dy: 1 }
const from = { x: 5, y: 5 }
assert.deepEqual(sniffStep(from, [up, right, down], [{ x: 9, y: 5 }], 0), right)
assert.deepEqual(sniffStep(from, [up, right, down], [{ x: 5, y: 9 }], 0), down)
assert.equal(
  sniffStep(from, [up, right], [{ x: 9, y: 5 }], SNIFF_CHANCE),
  null,
  'high rolls wander',
)
assert.equal(sniffStep(from, [], [{ x: 9, y: 5 }], 0), null, 'no options')
assert.equal(sniffStep(from, [up], [], 0), null, 'no gardener to follow')
console.log('seed burst sniffer ok')
