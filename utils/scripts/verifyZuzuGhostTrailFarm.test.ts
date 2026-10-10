// Regression: Zuzu's Ghost Trail must reward moving forward, not idle-fire farming.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import {
  advanceEncounterBudget,
  create,
  ENCOUNTER_STEP,
  MAX_ENCOUNTER_CREDITS,
} from '../arcade/games/zuzuGhostTrail'

const sameSpot = advanceEncounterBudget(0, 2, 40)
assert.deepEqual(sameSpot, { frontier: 0, credits: 2 })
assert.deepEqual(advanceEncounterBudget(3, 0, 40), {
  frontier: 3,
  credits: 0,
})
assert.deepEqual(advanceEncounterBudget(0, 0, 40 + ENCOUNTER_STEP * 20), {
  frontier: 20,
  credits: MAX_ENCOUNTER_CREDITS,
})

const game = create({
  rng: mulberry32(11),
  sound: { play: () => {} },
  demo: false,
  hiScore: 0,
})
const debug = game as typeof game & {
  invuln: number
  x: number
  encounterFrontier: number
  encounterCredits: number
  respawn: () => void
}
debug.invuln = 100_000
const firing = emptyInput()
firing.held.a = true
for (let t = 0; t < 60 * 40; t++) game.update(firing)
assert.ok(game.score < 1000, 'idle attack never farms a high score')
assert.equal(game.lives, 3, 'idle attack cannot farm extra lives')
assert.equal(debug.encounterFrontier, 0, 'a stationary player earns no credits')

debug.x = 40 + ENCOUNTER_STEP * 10
game.update(firing)
assert.equal(debug.encounterFrontier, 10, 'progress opens fresh encounters')
assert.ok(debug.encounterCredits <= MAX_ENCOUNTER_CREDITS)
debug.respawn()
assert.equal(debug.encounterFrontier, 10, 'dying cannot reset farmed segments')

console.log('Ghost Trail encounter budget contract passed')
