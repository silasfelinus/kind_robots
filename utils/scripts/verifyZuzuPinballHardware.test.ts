import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import {
  PinballPhysics,
  PHYSICS_HZ,
  livePhysicsWorlds,
} from '../arcade/pinball/physics/world'
import { ZUZU_LAST_BELL_GREYBOX as table } from '../arcade/pinball/tables/zuzuLastBell/table'
import { emptyInput } from '../arcade/types'

await RAPIER.init()

const seals = table.drops.filter((target) => target.bank === 'abbey-seals')
assert.deepEqual(
  seals.map((target) => target.id),
  ['abbey-seal-1', 'abbey-seal-2', 'abbey-seal-3', 'abbey-seal-4'],
)
assert.ok(
  seals.every((target) => !target.standup),
  'the seals drop',
)
// The Abbey deck's hollow bells (t-006) are standups: they ring, never drop.
const bells = table.drops.filter((target) => target.bank === 'abbey-bells')
assert.equal(bells.length, 3)
assert.ok(bells.every((target) => target.standup))
assert.equal(seals.length + bells.length, table.drops.length)
assert.equal(new Set(table.drops.map((target) => target.id)).size, 7)
assert.equal(
  table.spinners.filter((item) => item.id === 'relic-spinner').length,
  1,
)
assert.equal(table.kickers?.filter((item) => item.id === 'kickback').length, 1)
assert.ok(
  !table.shots.some((shot) => shot.id === 'abbey-seals'),
  'drop events are not ordered switch sensors',
)
assert.ok(table.shots.some((shot) => shot.id === 'relic-spinner'))

// These mechanisms must exist in Rapier, not merely as playfield illustrations.
// Reset each drop bank repeatedly, with live ball simulation and no leaked world.
for (let run = 0; run < 4; run++) {
  const physics = new PinballPhysics(RAPIER, table)
  try {
    assert.ok(
      table.drops.every((target) => physics.dropStates()[target.id] === true),
    )
    physics.resetDropBank('abbey-seals')
    assert.ok(
      table.drops.every((target) => physics.dropStates()[target.id] === true),
    )
    assert.ok(!physics.fireKicker('unknown-kicker'))
    physics.serveBall()
    for (let frame = 0; frame < 60; frame++) {
      physics.setFlipper('left', frame % 20 < 10)
      physics.setFlipper('right', frame % 20 >= 10)
      physics.step()
    }
    assert.equal(physics.ballCount, 1)
    assert.ok(
      physics.ballViews().every((ball) => Number.isFinite(ball.position[0])),
    )
  } finally {
    physics.dispose()
  }
}
// The captive relic ball (t-007): a real steel ball in its own lane behind
// the seals. Struck again and again it runs up its lane and settles back at
// the mouth; it never escapes, drains, or counts as a ball in play.
assert.deepEqual(
  (table.captives ?? []).map((c) => c.id),
  ['relic-captive'],
)
{
  const physics = new PinballPhysics(RAPIER, table)
  try {
    const rest = table.captives![0]!.at
    const [seal] = table.drops
    let strikes = 0
    let farthest = 0
    for (let shot = 0; shot < 20; shot++) {
      physics.serveBall(
        [seal!.at[0], rest[1], -0.2],
        [0, 0, -2.4 - shot * 0.05],
      )
      for (let i = 0; i < PHYSICS_HZ * 3; i++) {
        for (const event of physics.step())
          if (event.type === 'contact' && event.id === 'relic-captive')
            strikes++
        const [captive] = physics.captiveViews()
        assert.ok(captive, 'the relic is always on the table')
        assert.ok(
          Math.abs(captive.position[0] - rest[0]) < 0.006,
          'the relic stays in its lane',
        )
        assert.ok(captive.position[2] < rest[2] + 0.004, 'held at the mouth')
        farthest = Math.max(farthest, rest[2] - captive.position[2])
      }
    }
    assert.ok(strikes >= 5, `the ball in play strikes the relic (${strikes})`)
    assert.ok(farthest > 0.02, 'a strike sends the relic up its lane')
    assert.ok(
      physics.ballViews().every((b) => b.id > 0),
      'the relic is never a ball in play',
    )
    const [captive] = physics.captiveViews()
    assert.ok(Math.abs(captive!.position[2] - rest[2]) < 0.006, 'it settles')
  } finally {
    physics.dispose()
  }
}

assert.equal(livePhysicsWorlds(), 0)
assert.equal(emptyInput().held.left, false)
console.log(
  'Zuzu hardware: four resettable drops, kickback, spinner, captive relic ball and physics lifecycle OK',
)
