// /utils/scripts/verifyBrickBloomLadybots.test.ts
//
// Brick Bloom depth pass, slice 2 (conductor kr-arcade/t-079, depth-pass CABINETS.md section 11):
// the ladybot ring. Five dots orbit and shield one Vine Hall crate; break them one by one.
//
//   npx tsx utils/scripts/verifyBrickBloomLadybots.test.ts
import assert from 'node:assert/strict'
import brickBloom from '../arcade/games/brickBloom'
import { mulberry32 } from '../arcade/curve'
import {
  LADYBOT_POP_SCORE,
  RING_CLEAR_SCORE,
  RING_DOTS,
  RING_RADIUS,
  dotHit,
  popDot,
  ringShields,
  ringedCrate,
  spawnRing,
  stepRing,
} from '../arcade/brickBloom/ladybots'
import { HOUSES, HOUSE_LEGEND, houseWall } from '../arcade/brickBloom/houses'
import { parseWall } from '../arcade/brickBloom/walls'

assert.equal(ringedCrate(0, 'vine-3b'), null, 'no rings outside Vine Hall')
assert.equal(ringedCrate(1, 'vine-1'), null, 'not every Vine Hall wall')
for (const id of ['vine-3b', 'vine-4b']) {
  const at = ringedCrate(1, id)
  assert.ok(at, `${id} has a ringed crate`)
  const wall = houseWall(HOUSES[1]!, id)!
  const crates = parseWall(wall, HOUSE_LEGEND)
  assert.ok(
    crates.some((c) => c.col === at!.col && c.row === at!.row),
    `${id}: the ringed crate exists in the wall`,
  )
}

const ring = spawnRing(100, 80)
assert.equal(ring.dots.length, RING_DOTS, 'five dots')
assert.equal(ringShields(ring), true)
assert.equal(ringShields(null), false)
for (const d of ring.dots)
  assert.ok(
    Math.abs(Math.hypot(d.x - 100, d.y - 80) - RING_RADIUS) < 0.001,
    'dots sit on the ring',
  )

const first = { ...ring.dots[0]! }
for (let t = 0; t < 30; t++) stepRing(ring)
assert.notEqual(ring.dots[0]!.x, first.x, 'the ring orbits')
assert.ok(
  Math.abs(
    Math.hypot(ring.dots[0]!.x - 100, ring.dots[0]!.y - 80) - RING_RADIUS,
  ) < 0.001,
  'and keeps its radius',
)

const dots = [...ring.dots]
assert.equal(dotHit(dots[0]!, dots[0]!.x, dots[0]!.y), true)
assert.equal(dotHit(dots[0]!, dots[0]!.x + 30, dots[0]!.y), false)
for (let i = 0; i < RING_DOTS - 1; i++)
  assert.equal(popDot(ring, dots[i]!, 3), LADYBOT_POP_SCORE * 3)
assert.equal(ringShields(ring), true, 'one dot still shields the crate')
assert.equal(
  popDot(ring, dots[RING_DOTS - 1]!, 3),
  (LADYBOT_POP_SCORE + RING_CLEAR_SCORE) * 3,
  'the last dot pays the clear bonus',
)
assert.equal(ringShields(ring), false, 'the crate is open')
assert.equal(popDot(ring, dots[0]!, 3), 0, 'a popped dot scores nothing twice')

// Wired into the cabinet: Vine Hall's Hanging Garden rings a crate and the ring shields it.
type Crate = { col: number; row: number; hp: number; bolt: boolean }
type Inner = {
  tour: { house: number; wall: string } | null
  ring: { dots: unknown[] } | null
  ringBrick: Crate | null
  bricks: Crate[]
  startStage(stage: number): void
  crack(b: Crate): void
  update(input: unknown): void
}
const cab = brickBloom.create({
  rng: mulberry32(7),
  sound: { play: () => {} },
  demo: false,
  hiScore: 0,
}) as unknown as Inner
assert.equal(cab.ring, null, 'the first wall has no ring')
cab.tour = { house: 1, wall: 'vine-3b' }
cab.startStage(4)
assert.equal(cab.ring?.dots.length, RING_DOTS, 'Vine Hall rings a crate')
const guarded = cab.ringBrick!
const hp = guarded.hp
cab.crack(guarded)
assert.equal(guarded.hp, hp, 'the ring shields its crate')
cab.ring!.dots.length = 0
cab.crack(guarded)
assert.equal(guarded.hp, hp - 1, 'a cleared ring leaves the crate open')
cab.tour = { house: 0, wall: 'seed-2a' }
cab.startStage(2)
assert.equal(cab.ring, null, 'the Seedling House has no ring')

console.log('Brick Bloom ladybot ring: orbit, shield, pop and clear passed')
