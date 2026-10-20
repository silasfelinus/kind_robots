// Seed Burst (conductor kr-arcade/t-009): six garden looks, one per round in turn.
//
//   npx tsx utils/scripts/verifyCabinetSeedBurstGardens.test.ts
import assert from 'node:assert/strict'
import { GARDENS } from '../arcade/games/seedBurst'

assert.equal(GARDENS.length, 6)
assert.equal(new Set(GARDENS.map((g) => g.grass.join())).size, 6)
for (const g of GARDENS) assert.ok(g.flowers.length >= 3)
