import assert from 'node:assert/strict'
import {
  RAINBOW_GUARDIAN,
  createRainbowGuardian,
} from '../arcade/games/rainbowGuardian'
import { recutTimeline } from '../arcade/games/rainbowPacing'
import {
  PINKWAKE_GUARDIAN,
  PINKWAKE_SECTIONS,
  PINKWAKE_WAVES,
} from '../arcade/games/rainbowPinkwake'
import {
  MORTAR,
  RAINBOW_SHIP_SPEED,
  createRainbowPrincessPreview,
} from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

// Silas's second playtest (2026-10-19): "ship should move faster. The miniboss died too quick, really quick. we
// need more variety in bullets: perhaps something that launches something else that explodes? ... everything just
// sits and floats. it's easy and a little unexciting."

assert.ok(RAINBOW_SHIP_SPEED > 2.6, 'the ship flies faster')
assert.ok(
  RAINBOW_GUARDIAN.baseHp >= 2 * 24,
  'guardians carry over twice the hull',
)
assert.equal(createRainbowGuardian('urchin', 1).maxHp, 125)

// A stretched section moves everything after it back, and nothing before it.
{
  const cut = recutTimeline(
    [
      { name: 'a', from: 0, to: 100 },
      { name: 'b', from: 100, to: 200 },
      { name: 'c', from: 200, to: 300 },
    ],
    [],
    { b: 50 },
  )
  assert.deepEqual(
    cut.sections.map((s) => [s.from, s.to]),
    [
      [0, 100],
      [100, 250],
      [250, 350],
    ],
  )
  assert.equal(cut.at(150), 150)
  assert.throws(() =>
    recutTimeline([{ name: 'a', from: 0, to: 1 }], [], { z: 1 }),
  )
}
// Act I's guardian section is long enough to fight its tougher guardian.
assert.ok(PINKWAKE_GUARDIAN.to - PINKWAKE_GUARDIAN.from >= 45 * 60)
assert.ok(PINKWAKE_SECTIONS.some((s) => s.name === PINKWAKE_GUARDIAN.name))
assert.ok(
  PINKWAKE_WAVES.filter((w) => w.kind === 'mortar').length >= 5,
  'mortars join Act I',
)

function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const game = createRainbowPrincessPreview({
  players: 1,
  demo: true,
  rng: seeded(),
  sound: { play() {} },
  hiScore: 0,
})
const seen = { lobs: 0, landed: 0, bomblets: 0, fans: 0, rushed: 0, darted: 0 }
for (let frame = 0; frame < 14000; frame++) {
  const before = game.snapshot
  game.update(emptyInput())
  const after = game.snapshot
  for (const shot of after.enemyShots) {
    if (shot.burst !== 'cluster') continue
    // Every shell is ringed where it will land; a fresh one has flown the frame it was lobbed.
    assert.ok(shot.tx !== undefined && shot.ty !== undefined)
    assert.ok(shot.fuse! < MORTAR.flight)
    if (shot.fuse === MORTAR.flight - 1) seen.lobs++
  }
  for (const shot of before.enemyShots) {
    if (shot.burst !== 'cluster' || shot.fuse !== 1) continue
    const x = shot.x + shot.vx
    const y = shot.y + shot.vy
    assert.ok(
      Math.hypot(x - shot.tx!, y - shot.ty!) < 3,
      'the shell lands on its ring',
    )
    seen.landed++
    const bomblets = after.enemyShots.filter(
      (s) => s.burst === 'split' && Math.hypot(s.x - x, s.y - y) < 1e-6,
    )
    if (bomblets.length) {
      assert.equal(bomblets.length, MORTAR.bomblets)
      seen.bomblets += bomblets.length
    }
  }
  for (const shot of before.enemyShots)
    if (shot.burst === 'split' && shot.fuse === 1) seen.fans++
  // Plain craft rush in from the edge faster than they cruise, and slide between lanes.
  for (const enemy of after.enemies) {
    const was = before.enemies.find(
      (e) =>
        e.kind === enemy.kind &&
        e.wave === enemy.wave &&
        e.phase === enemy.phase,
    )
    if (!was) continue
    if (enemy.kind === 'picket' && was.x > 440 && was.x - enemy.x > 2.5)
      seen.rushed++
    if (enemy.dartY !== undefined && was.dartY === undefined) seen.darted++
  }
}
for (const [what, count] of Object.entries(seen))
  assert.ok(count > 0, `Act I shows ${what} (${count})`)

console.log(
  `rainbow playtest two: ok (speed ${RAINBOW_SHIP_SPEED}, guardian hull 125, ${seen.lobs} mortar shells, ${seen.bomblets} bomblets, ${seen.rushed} rushing frames, ${seen.darted} darts)`,
)
