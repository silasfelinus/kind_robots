// /utils/scripts/verifyBrickBloomMites.test.ts
//
// Brick Bloom depth pass, slice 2 (conductor kr-arcade/t-079, depth-pass CABINETS.md section 11):
// the pollen mite. A line of three hatch enemies sways down from the Seedling House roof vents; a
// ball through one pops it, and popping the whole line pays a petal chain.
//
//   npx tsx utils/scripts/verifyBrickBloomMites.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import brickBloom from '../arcade/games/brickBloom'
import {
  MITE_CHAIN_SCORE,
  MITE_FLOOR,
  MITE_POP_SCORE,
  MITE_SWAY,
  miteGone,
  miteHit,
  mitesHatch,
  popMite,
  spawnMiteLine,
  stepMite,
} from '../arcade/brickBloom/mites'
import type { MiteLine } from '../arcade/brickBloom/mites'

assert.equal(mitesHatch(0, 'seed-1'), false, 'no mites on the first wall')
assert.equal(
  mitesHatch(0, 'seed-2a'),
  true,
  'mites hatch in the Seedling House',
)
assert.equal(mitesHatch(1, 'vine-2a'), false, 'not in Vine Hall')

const line = spawnMiteLine(128)
assert.equal(line.mites.length, 3, 'a line of three')
const startY = line.mites[0]!.y
for (let t = 0; t < 100; t++) for (const m of line.mites) stepMite(m, t)
assert.ok(line.mites[0]!.y > startY, 'mites sway down')
assert.ok(
  Math.abs(line.mites[0]!.x - line.mites[0]!.baseX) <= MITE_SWAY + 0.001,
  'and sway within their lane',
)
assert.equal(miteGone({ ...line.mites[0]!, y: MITE_FLOOR + 1 }), true)

const [a, b, c] = line.mites
assert.equal(miteHit(a!, a!.x, a!.y), true)
assert.equal(miteHit(a!, a!.x + 40, a!.y), false)
assert.equal(popMite(line, a!, 2), MITE_POP_SCORE * 2)
assert.equal(popMite(line, b!, 2), MITE_POP_SCORE * 2)
assert.equal(
  popMite(line, c!, 2),
  (MITE_POP_SCORE + MITE_CHAIN_SCORE) * 2,
  'the last mite of the line pays the petal chain',
)

type Inner = {
  tour: { house: number; wall: string } | null
  miteLine: MiteLine | null
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

assert.equal(g.miteLine, null, 'the first wall has no mites')
g.tour = { house: 0, wall: 'seed-2a' }
g.startStage(2)
assert.equal(
  g.miteLine?.mites.length,
  3,
  'the second Seedling wall hatches three',
)
g.tour = { house: 1, wall: 'vine-2a' }
g.startStage(3)
assert.equal(g.miteLine, null, 'Vine Hall has none')

g.tour = { house: 0, wall: 'seed-2a' }
g.startStage(2)
const target = g.miteLine!.mites[1]!
const before = g.score
g.stepBall(
  {
    x: target.x,
    y: target.y,
    vx: 0,
    vy: 0,
    stuck: null,
    curl: 0,
    curlDir: 0,
    since: 999,
    hitDir: 0,
  },
  0,
  0,
)
assert.equal(g.miteLine?.mites.length, 2, 'a ball through a mite pops it')
assert.ok(g.score > before, 'and scores')

console.log('Brick Bloom pollen mite: hatch, sway, pop and petal chain passed')
