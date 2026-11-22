import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create } from '../arcade/games/repairRampage'
import { emptyInput } from '../arcade/types'

function runAttractPilot(seed: number) {
  const game = create({
    rng: mulberry32(seed),
    sound: { play: () => undefined },
    demo: true,
    hiScore: 0,
  })
  const input = emptyInput()
  let ticks = 0
  let highestTown = game.level
  while (!game.over && ticks < 9_000) {
    game.update(input)
    highestTown = Math.max(highestTown, game.level)
    ticks++
  }
  assert.equal(game.score, 0, 'attract demo cannot post a score')
  assert.ok(highestTown >= 2, 'demo repairs at least one whole town')
  return { ticks, highestTown, over: game.over }
}

assert.deepEqual(
  runAttractPilot(5),
  runAttractPilot(5),
  'same seed and inputs must reproduce the entire attract pilot',
)
console.log('Repair Rampage: seeded nine-thousand-tick attract gameplay pilot')
