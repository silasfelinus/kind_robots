// Burrow Buddy (conductor kr-arcade t-106): the first beetle arrives in garden 2,
// as the blurb promises, and the veggie bonus climbs a ladder of richer prizes.
//
//   npx tsx utils/scripts/verifyBurrowBuddyLadder.test.ts

import assert from 'node:assert/strict'
import { levelCurve } from '../arcade/curve'
import {
  BURROW_CURVES,
  VEGGIE_LADDER,
  veggieForGarden,
} from '../arcade/games/burrowBuddy'

const beetles = (g: number) => Math.floor(levelCurve(g, BURROW_CURVES.beetles))

assert.equal(beetles(1), 0, 'no beetles in garden 1')
assert.equal(beetles(2), 1, 'first beetle in garden 2')
assert.equal(beetles(4), 2)
assert.equal(beetles(6), 3)
assert.equal(beetles(40), 3, 'beetles stay capped at 3')

assert.equal(veggieForGarden(1).name, 'CARROT')
assert.equal(veggieForGarden(2).name, 'CARROT')
assert.equal(veggieForGarden(3).name, 'RADISH')
assert.equal(veggieForGarden(99).name, 'GOLDEN BEET')
let last = 0
for (let g = 1; g <= 60; g++) {
  const pts = veggieForGarden(g).points
  assert.ok(pts >= last, `veggie value never drops (garden ${g})`)
  last = pts
}
assert.equal(VEGGIE_LADDER[0].from, 1)

console.log('verifyBurrowBuddyLadder: ok')
