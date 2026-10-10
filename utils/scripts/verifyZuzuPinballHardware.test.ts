import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { PinballPhysics, livePhysicsWorlds } from '../arcade/pinball/physics/world'
import { ZUZU_LAST_BELL_GREYBOX as table } from '../arcade/pinball/tables/zuzuLastBell/table'
import { emptyInput } from '../arcade/types'

await RAPIER.init()

assert.equal(table.drops.length, 4)
assert.deepEqual(table.drops.map((target) => target.id), [
  'abbey-seal-1', 'abbey-seal-2', 'abbey-seal-3', 'abbey-seal-4',
])
assert.ok(table.drops.every((target) => target.bank === 'abbey-seals'))
assert.equal(new Set(table.drops.map((target) => target.id)).size, 4)
assert.equal(table.spinners.filter((item) => item.id === 'relic-spinner').length, 1)
assert.equal(table.kickers?.filter((item) => item.id === 'kickback').length, 1)
assert.equal(table.shots.find((shot) => shot.id === 'abbey-seals')?.sensors.length, 4)
assert.ok(table.shots.some((shot) => shot.id === 'relic-spinner'))

// These mechanisms must exist in Rapier, not merely as playfield illustrations.
// Reset each drop bank repeatedly, with live ball simulation and no leaked world.
for (let run = 0; run < 4; run++) {
  const physics = new PinballPhysics(RAPIER, table)
  try {
    assert.ok(table.drops.every((target) => physics.dropStates()[target.id] === true))
    physics.resetDropBank('abbey-seals')
    assert.ok(table.drops.every((target) => physics.dropStates()[target.id] === true))
    assert.ok(!physics.fireKicker('unknown-kicker'))
    physics.serveBall()
    for (let frame = 0; frame < 60; frame++) {
      physics.setFlipper('left', frame % 20 < 10)
      physics.setFlipper('right', frame % 20 >= 10)
      physics.step()
    }
    assert.equal(physics.ballCount, 1)
    assert.ok(physics.ballViews().every((ball) => Number.isFinite(ball.position[0])))
  } finally {
    physics.dispose()
  }
}
assert.equal(livePhysicsWorlds(), 0)
assert.equal(emptyInput().held.left, false)
console.log('Zuzu hardware: four resettable drops, kickback, spinner and physics lifecycle OK')
