import assert from 'node:assert/strict'
import {
  PINKWAKE, pinkwakeDialogue, pinkwakeScene, pinkwakeSpawn, pinkwakeStage,
} from '../arcade/games/rainbowPinkwake'
import {
  BOSS_MAX_HP, bossTelegraph, createPinkwakeBoss, stepPinkwakeBoss,
} from '../arcade/games/rainbowPinkwakeBoss'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

assert.equal(pinkwakeStage(1, null), 'opening')
assert.equal(pinkwakeStage(PINKWAKE.openingEnds, null), 'waves')
assert.equal(pinkwakeStage(PINKWAKE.turnStarts, null), 'turn')
assert.equal(pinkwakeStage(PINKWAKE.bossStarts, null), 'boss')
assert.equal(pinkwakeStage(5000, 4850), 'aftermath')
assert.equal(pinkwakeSpawn(100), null, 'opening scene is a safe corridor')
assert.equal(pinkwakeSpawn(312), 'picket')
assert.equal(pinkwakeSpawn(1320), 'spiral')
assert.equal(pinkwakeSpawn(2450), 'anchor')
assert.equal(pinkwakeSpawn(3362), 'urchin')
assert.equal(pinkwakeSpawn(PINKWAKE.turnStarts), null, 'pre-boss dialogue is safe')
assert.equal(pinkwakeScene(10, null)?.id, 'A01.OPEN')
assert.equal(pinkwakeScene(1100, null), null)
assert.equal(pinkwakeScene(PINKWAKE.turnStarts, null)?.id, 'A01.TURN')
assert.equal(pinkwakeScene(PINKWAKE.bossStarts, null), null)
assert.equal(pinkwakeScene(4900, 4900)?.id, 'A01.AFTER')
assert.equal(pinkwakeScene(4900 + PINKWAKE.aftermathFrames, 4900), null)

for (const count of [1, 2, 3, 4]) {
  for (const scene of ['A01.OPEN', 'A01.TURN', 'A01.AFTER'] as const) {
    for (const rescued of [true, false]) {
      for (const elapsed of [0, 96, 192]) {
        const line = pinkwakeDialogue(scene, elapsed, count, rescued)
        assert.ok(line?.speaker)
        assert.ok(line?.text)
        const active = ['Maribel', 'Azure', 'Solenne', 'Vivi'].slice(0, count)
        assert.ok(line.speaker === 'Lilt-7' || active.includes(line.speaker))
      }
      assert.equal(pinkwakeDialogue(scene, PINKWAKE.aftermathFrames, count, rescued), null)
    }
  }
}
const boss = createPinkwakeBoss()
assert.equal(boss.hp, BOSS_MAX_HP)
let bullets = 0
let warned = false
for (let tick = 0; tick < 510; tick++) {
  if (tick === 180) boss.hp = 90
  if (tick === 330) boss.hp = 30
  warned ||= bossTelegraph(boss)
  const volley = stepPinkwakeBoss(boss, [{ x: 60, y: 130, lives: 3 }])
  bullets += volley.length
  assert.ok(volley.every((bullet) =>
    bullet.vx < 0 && Math.hypot(bullet.vx, bullet.vy) <= 2.11))
}
assert.equal(boss.phase, 3)
assert.ok(warned, 'boss has visible shot telegraph')
assert.ok(bullets >= 10, 'all phases fire real volleys')
assert.equal(boss.x, 398)

function rng(seed = 427) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const create = () => createRainbowPrincessPreview({
  rng: rng(), sound: { play() {} }, demo: true, hiScore: 0, players: 2,
})
const a = create()
const b = create()
for (let tick = 0; tick < 4650; tick++) {
  const frame = emptyInput()
  a.update(frame, [frame, frame])
  b.update(frame, [frame, frame])
  if (tick % 300 === 0 || tick > 4498) {
    assert.deepEqual(a.snapshot, b.snapshot, `Act I desynchronized at tick ${tick}`)
  }
}
assert.equal(a.snapshot.act, 'S01')
assert.equal(a.snapshot.stage, 'boss')
assert.ok(a.snapshot.boss, 'Pearl Seahorse enters after authored pre-boss scene')
assert.equal(a.snapshot.sceneId, null, 'dangerous boss volley has no dialogue overlay')
console.log('Pinkwake Act I wave, comms and boss fixtures passed')
