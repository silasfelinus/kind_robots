// Pixel Hop (conductor kr-arcade t-083): level 5 swaps in the cycle rule, where
// every hop advances a tile through three colours and wraps; a tile hopped
// three times is back where it started.
//
//   npx tsx utils/scripts/verifyPixelHopCycle.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create } from '../arcade/games/pixelHop'
import type { InputFrame } from '../arcade/types'

type Probe = {
  level: number
  paint: number[][]
  me: { r: number; c: number }
  over: boolean
  score: number
  startRound(round: number): void
  land(): void
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

function make(seed: number, demo = false): Probe {
  return create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
  }) as unknown as Probe
}

// Levels are four rounds each, so round 17 opens level 5: the cycle rule.
const game = make(3)
game.startRound(17)
assert.equal(game.level, 5)
const seen: number[] = []
for (let i = 0; i < 4; i++) {
  game.land()
  seen.push(game.paint[0]![0]!)
}
assert.deepEqual(seen, [1, 2, 0, 1], 'a cycle tile steps 1, 2, 0 and wraps')

// Earlier levels keep their rules: one hop paints a tile at once.
const early = make(3)
early.startRound(1)
early.land()
assert.equal(early.paint[0]![0], 2, 'level 1 still paints in one hop')

// Cycle rounds still end on their own and the attract demo still scores 0.
const demo = make(9, true)
demo.startRound(17)
for (let t = 0; t < 60 * 60 * 6 && !demo.over; t++) demo.update(idle())
assert.equal(demo.score, 0, 'the attract demo scores 0')
console.log('Pixel Hop cycle passed')
