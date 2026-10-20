// /utils/scripts/verifyBrickBloomSnails.test.ts
//
// Brick Bloom depth pass, slice 2 (conductor kr-arcade/t-079, depth-pass CABINETS.md section 11):
// the snail bot. It patrols a lane in Vine Hall; its shell bounces the ball and two hits crack it.
//
//   npx tsx utils/scripts/verifyBrickBloomSnails.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import brickBloom from '../arcade/games/brickBloom'
import { LEFT, RIGHT } from '../arcade/brickBloom/rules'
import {
  SNAIL_LANE,
  SNAIL_RADIUS,
  SNAIL_SCORE,
  crackSnail,
  snailHit,
  snailsPatrol,
  spawnSnail,
  stepSnail,
} from '../arcade/brickBloom/snails'
import type { Snail } from '../arcade/brickBloom/snails'

assert.equal(snailsPatrol(1, 'vine-1'), false, 'no snail on the first wall')
assert.equal(snailsPatrol(1, 'vine-2a'), true, 'snails patrol Vine Hall')
assert.equal(snailsPatrol(0, 'seed-2a'), false, 'not in the Seedling House')

const s = spawnSnail(true)
assert.equal(s.y, SNAIL_LANE)
for (let t = 0; t < 4000; t++) {
  stepSnail(s)
  assert.ok(
    s.x >= LEFT + SNAIL_RADIUS - 0.001 && s.x <= RIGHT - SNAIL_RADIUS + 0.001,
  )
}
const turned = spawnSnail(false)
assert.equal(turned.dir, -1)
assert.equal(snailHit(turned, turned.x, turned.y), true)
assert.equal(snailHit(turned, turned.x + 40, turned.y), false)
assert.equal(crackSnail(turned, 3), 0, 'the first hit only dents the shell')
assert.equal(crackSnail(turned, 3), SNAIL_SCORE * 3, 'the second cracks it')

type Inner = {
  tour: { house: number; wall: string } | null
  snail: Snail | null
  balls: { x: number; y: number; vx: number; vy: number }[]
  score: number
  startStage(stage: number): void
  stepBall(b: unknown, dx: number, dy: number): void
}
const g = brickBloom.create({
  rng: mulberry32(7),
  sound: { play: () => {} },
  demo: false,
  hiScore: 0,
}) as unknown as Inner
assert.equal(g.snail, null, 'the first wall has no snail')
g.tour = { house: 1, wall: 'vine-2a' }
g.startStage(3)
assert.ok(g.snail, 'the second Vine Hall wall sends a snail')
g.tour = { house: 0, wall: 'seed-2a' }
g.startStage(2)
assert.equal(g.snail, null, 'the Seedling House has none')
console.log('verifyBrickBloomSnails: ok')
