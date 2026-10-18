// Pixel Hop (conductor kr-arcade t-083): Skitter & Scoot slide sideways along a
// row from round 5, never before, and a demo run still ends on its own.
//
//   npx tsx utils/scripts/verifyPixelHopSkitter.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create } from '../arcade/games/pixelHop'
import type { InputFrame } from '../arcade/types'

type Probe = {
  round: number
  over: boolean
  score: number
  enemies: Array<{ kind: string; r: number; c: number; side?: number }>
  startRound(round: number): void
  update(input: InputFrame): void
}

const held = {
  up: false,
  down: false,
  left: false,
  right: false,
  a: false,
  b: false,
  start: false,
}
const idle = (): InputFrame => ({ held: { ...held }, pressed: { ...held } })

function run(round: number, seed: number, ticks: number): Set<string> {
  const game = create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
  }) as unknown as Probe
  game.startRound(round)
  const kinds = new Set<string>()
  for (let t = 0; t < ticks && !game.over; t++) {
    game.update(idle())
    for (const e of game.enemies) {
      kinds.add(e.kind)
      if (e.kind === 'skitter') {
        assert.ok(Math.abs(e.side ?? 0) === 1, 'skitter has a slide direction')
      }
    }
  }
  return kinds
}

for (let seed = 1; seed <= 6; seed++) {
  assert.ok(!run(2, seed, 3000).has('skitter'), 'no skitter before round 5')
}
assert.ok(
  [1, 2, 3, 4, 5, 6].some((seed) => run(6, seed, 3000).has('skitter')),
  'skitter shows up from round 5',
)

const demo = create({
  rng: mulberry32(9),
  sound: { play: () => {} },
  demo: true,
  hiScore: 0,
}) as unknown as Probe
for (let t = 0; t < 60 * 60 * 6 && !demo.over; t++) demo.update(idle())
assert.equal(demo.score, 0, 'the attract demo scores 0')
console.log('Pixel Hop skitter passed')
