import assert from 'node:assert/strict'
import {
  PINKWAKE,
  pinkwakeDialogue,
  pinkwakeScene,
  pinkwakeSpawn,
  pinkwakeStage,
} from '../arcade/games/rainbowPinkwake'
import {
  BOSS_MAX_HP,
  bossTelegraph,
  createPinkwakeBoss,
  stepPinkwakeBoss,
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
assert.equal(
  pinkwakeSpawn(PINKWAKE.turnStarts),
  null,
  'pre-boss dialogue is safe',
)
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
        assert.ok(line)
        assert.ok(line.speaker)
        assert.ok(line.text)
        const active = ['Maribel', 'Azure', 'Solenne', 'Vivi'].slice(0, count)
        assert.ok(line.speaker === 'Lilt-7' || active.includes(line.speaker))
      }
      assert.equal(
        pinkwakeDialogue(scene, PINKWAKE.aftermathFrames, count, rescued),
        null,
      )
    }
  }
}
const boss = createPinkwakeBoss()
assert.equal(boss.hp, BOSS_MAX_HP)
let bullets = 0
let warned = false
let warningFrames = 0
let volleys = 0
for (let tick = 0; tick < 510; tick++) {
  if (tick === 180) boss.hp = 90
  if (tick === 330) boss.hp = 30
  const volley = stepPinkwakeBoss(boss, [{ x: 60, y: 130, lives: 3 }])
  if (volley.length) {
    assert.ok(
      warningFrames >= 36,
      `B01 phase ${boss.phase} fired without 36 consecutive warning frames`,
    )
    warningFrames = 0
    volleys++
  }
  if (bossTelegraph(boss)) {
    warned = true
    warningFrames++
  } else if (!volley.length) {
    warningFrames = 0
  }
  bullets += volley.length
  assert.ok(
    volley.every(
      (bullet) => bullet.vx < 0 && Math.hypot(bullet.vx, bullet.vy) <= 2.11,
    ),
  )
}
assert.equal(boss.phase, 3)
assert.ok(warned, 'boss has visible shot telegraph')
assert.ok(volleys >= 3, 'all boss phases reach an actual volley')
assert.ok(bullets >= 10, 'all phases fire real volleys')
assert.equal(boss.x, 398)

// Reproduce the real engine order: step boss at frame 269, then a ship
// projectile drops phase-2 health below 50 before the next update.
// The legacy modulo schedule fired seven phase-3 pellets on frame 270.
const damageBoundary = createPinkwakeBoss()
for (let frame = 0; frame < 269; frame++) {
  if (frame === 170) damageBoundary.hp = 51
  stepPinkwakeBoss(damageBoundary, [{ x: 60, y: 130, lives: 3 }])
}
assert.equal(damageBoundary.frame, 269)
assert.equal(damageBoundary.phase, 2)
damageBoundary.hp = 49
const premature = stepPinkwakeBoss(damageBoundary, [
  { x: 60, y: 130, lives: 3 },
])
assert.equal(premature.length, 0, 'phase-3 must not volley immediately')
assert.equal(damageBoundary.phase, 3)
assert.equal(damageBoundary.nextVolleyAt, 342)
let phaseWarning = 0
for (let frame = 271; frame <= 341; frame++) {
  const shot = stepPinkwakeBoss(damageBoundary, [
    { x: 60, y: 130, lives: 3 },
  ])
  assert.equal(shot.length, 0, 'phase transition is visibly rearmed')
  if (bossTelegraph(damageBoundary)) phaseWarning++
}
assert.equal(phaseWarning, 36)
assert.equal(
  stepPinkwakeBoss(damageBoundary, [{ x: 60, y: 130, lives: 3 }]).length,
  7,
  'third phase begins only after its full telegraph',
)

function rng(seed = 427) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const create = () =>
  createRainbowPrincessPreview({
    rng: rng(),
    sound: { play() {} },
    demo: true,
    hiScore: 0,
    players: 2,
  })
const a = create()
const b = create()
for (let tick = 0; tick < 4650; tick++) {
  const frame = emptyInput()
  a.update(frame, [frame, frame])
  b.update(frame, [frame, frame])
  if (tick % 300 === 0 || tick > 4498) {
    assert.deepEqual(
      a.snapshot,
      b.snapshot,
      `Act I desynchronized at tick ${tick}`,
    )
  }
}
assert.equal(a.snapshot.act, 'S01')
assert.equal(a.snapshot.stage, 'boss')
assert.ok(
  a.snapshot.boss,
  'Pearl Seahorse enters after authored pre-boss scene',
)
assert.equal(
  a.snapshot.sceneId,
  null,
  'dangerous boss volley has no dialogue overlay',
)
console.log('Pinkwake Act I wave, comms and boss fixtures passed')
