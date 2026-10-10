import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import { create } from '../arcade/games/zuzuGhostTrail'

const game = create({
  rng: mulberry32(20261010),
  sound: { play: () => {} },
  demo: false,
  hiScore: 0,
})
const run = game as typeof game & {
  x: number
  y: number
  won: boolean
  invuln: number
  clear: number
  foundSecrets: Set<string>
  startStage: (stage: number) => void
  respawn: () => void
  banner: { text: string; sub?: string } | null
}
const locations = [
  { x: 346, y: 164, key: 'town' },
  { x: 295, y: 160, key: 'boneyard' },
  { x: 608, y: 162, key: 'waterhole' },
  { x: 394, y: 158, key: 'belltower' },
]
for (const [index, secret] of locations.entries()) {
  run.startStage(index + 1)
  run.invuln = 99999
  run.x = secret.x
  run.y = secret.y
  game.update(emptyInput())
  assert.ok(
    run.foundSecrets.has(secret.key),
    `stage ${index + 1} relic can be reached from its boardwalk`,
  )
  assert.equal(run.foundSecrets.size, index + 1)
  const score = game.score
  run.respawn()
  run.x = secret.x
  run.y = secret.y
  game.update(emptyInput())
  assert.equal(game.score, score, 'checkpoint replay never awards relic twice')
}
assert.equal(run.foundSecrets.size, 4)
run.clear = 1
game.update(emptyInput())
assert.equal(run.won, true, 'the last gate is a victory, not a death')
assert.equal(run.over, false, 'the player sees the victory interlude')
assert.equal(run.banner?.text, 'PREVIEW CLEARED')
assert.equal(run.banner?.sub, '4/4 RELICS FOUND')
const finalScore = game.score
for (let i = 0; i < 180; i++) game.update(emptyInput())
assert.equal(run.over, true, 'the score screen follows a three-second victory')
assert.equal(game.score, finalScore, 'victory cannot repeatedly award stage bonuses')

const defeated = create({
  rng: mulberry32(1),
  sound: { play: () => {} },
  demo: false,
  hiScore: 0,
})
const lost = defeated as typeof defeated & {
  lives: number
  dead: number
  won: boolean
}
lost.lives = 0
lost.dead = 1
defeated.update(emptyInput())
assert.equal(defeated.over, true)
assert.equal(lost.won, false, 'defeat never grants a victory')

console.log('Ghost Trail campaign secrets and preview victory passed')
