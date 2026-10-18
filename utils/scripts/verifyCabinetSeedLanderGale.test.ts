// Seed Lander depth pass, slice 4 part 3 (conductor kr-arcade/t-072, depth-pass CABINETS.md
// section 9): Gale Season, the New Game+ after the true ending.
//
//   npx tsx utils/scripts/verifyCabinetSeedLanderGale.test.ts
import assert from 'node:assert/strict'
import {
  GALE_MAX,
  freshSave,
  galeMission,
  readLanderSave,
} from '../arcade/seedLander/campaign'
import {
  ISLANDS,
  MISSIONS_PER_ISLAND,
  VAULT_INDEX,
} from '../arcade/seedLander/islands'

const base = ISLANDS[0]!.missions[0]!

// Round 0 is the first run, untouched.
assert.equal(galeMission(base, 0), base)

// Each round is windier and heavier, up to a ceiling, and never mutates the original.
const g1 = galeMission(base, 1)
const g3 = galeMission(base, 3)
assert.ok(g1.wind > base.wind)
assert.ok(g3.wind > g1.wind)
assert.ok((g3.gravity ?? 1) > (g1.gravity ?? 1))
assert.ok((g1.gravity ?? 1) > (base.gravity ?? 1))
assert.ok(galeMission(base, 99).wind <= 0.012)
assert.equal(galeMission(base, 99).gravity, galeMission(base, GALE_MAX).gravity)
assert.equal(g1.id, base.id)
assert.equal(g1.map, base.map)

// The round survives a save round trip; junk is dropped to 0.
const read = (gale: unknown) =>
  readLanderSave(
    { ...freshSave(), island: VAULT_INDEX + 1, gale },
    VAULT_INDEX + 1,
    MISSIONS_PER_ISLAND,
  )
assert.equal(read(2)!.gale, 2)
assert.equal(read(undefined)!.gale, 0)
assert.equal(read(-1)!.gale, 0)
assert.equal(read(GALE_MAX + 1)!.gale, 0)
assert.equal(read('2')!.gale, 0)
assert.equal(freshSave().gale, 0)

console.log('Seed Lander Gale Season: ok')
