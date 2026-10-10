// Dimensioned mechanical gates and real Rapier dynamics for the private
// Zuzu table. This is a geometry harness, not a mocked Arcade rendering test.
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { PinballPhysics, PHYSICS_HZ, livePhysicsWorlds } from '../arcade/pinball/physics/world'
import { ZUZU_LAST_BELL_GREYBOX as table } from '../arcade/pinball/tables/zuzuLastBell/table'
import type { Vec3 } from '../arcade/pinball/types'

await RAPIER.init()

const radius = table.physical.ballRadiusM
const shooter = table.plunger.rest
const gate = table.colliders.find((collider) => collider.id === 'shooter-gate')
const stop = table.colliders.find((collider) => collider.id === 'plunger-stop')
const divider = table.colliders.find((collider) => collider.id === 'shooter-divider')
assert.ok(gate?.kind === 'box')
assert.deepEqual(gate.passDir, [0, 0, -1])
assert.ok(stop?.kind === 'box')
assert.ok(divider?.kind === 'box')
assert.ok(shooter[0] > 0.245 + radius && shooter[0] < 0.3 - radius)
assert.ok(table.physical.pitchDeg >= 6 && table.physical.pitchDeg <= 7)
assert.equal(table.physical.widthM, 0.56)
assert.equal(radius, 0.0135)
assert.ok(table.flippers.every((flipper) => flipper.strokeMs <= 25))
assert.ok(table.flippers.every((flipper) => flipper.returnMs > flipper.strokeMs))

const run = (steps: number, f: (step: number) => void) => {
  for (let step = 0; step < steps; step++) f(step)
}

// The trough physically retains a newly served ball until the player plunges.
// Without the stop, the ball could cross drainZ before a keyboard event arrived.
{
  const physics = new PinballPhysics(RAPIER, table)
  try {
    const id = physics.serveBall()
    run(PHYSICS_HZ * 2, () => physics.step())
    assert.equal(physics.ballCount, 1, 'unlaunched ball must remain in its lane')
    assert.ok(physics.ballOnPlunger(), 'resting ball remains launchable')
    assert.equal(physics.ballViews()[0]?.id, id)
  } finally {
    physics.dispose()
  }
}

// The main shooter test simulates a full charged plunge, not a prepositioned
// ball. An launched ball must pass the launch gate and return to the main
// flipper-controlled field rather than getting trapped in the shooter lane.
for (const power of [0.6, 1]) {
  const physics = new PinballPhysics(RAPIER, table)
  try {
    const id = physics.serveBall()
    assert.ok(physics.launch(power))
    assert.equal(physics.launch(power), true, 'launch is allowed while ball is in lane')
    let highestZ = Infinity
    let reachedMain = false
    let escapedShooter = false
    let drained = false
    run(PHYSICS_HZ * 7, () => {
      const events = physics.step()
      if (events.some((e) => e.type === 'drain' && e.ballId === id))
        drained = true
      const ball = physics.ballViews().find((b) => b.id === id)
      if (!ball) return
      const [x, , z] = ball.position
      highestZ = Math.min(highestZ, z)
      if (z < -0.58) escapedShooter = true
      if (z < -0.15 && x < 0.225) reachedMain = true
    })
    console.log('Zuzu shooter sweep', {
      power, highestZ: Number(highestZ.toFixed(4)), escapedShooter,
      reachedMain, drained,
    })
    assert.ok(escapedShooter, `plunge ${power} must pass the upper gate`)
    assert.ok(reachedMain, `plunge ${power} must feed the main field`)
  } finally {
    physics.dispose()
  }
}

// Lower flippers must actually rotate under held input and return to rest.
// The test measures the Rapier-owned motors, not only input event wiring.
{
  const physics = new PinballPhysics(RAPIER, table)
  try {
    const atRest = physics.flipperAngles()
    assert.equal(atRest['zuzu-lower-left'], table.flippers[0]!.restAngle)
    assert.equal(atRest['zuzu-lower-right'], table.flippers[1]!.restAngle)
    physics.setFlipper('left', true)
    run(8, () => physics.step())
    const flipped = physics.flipperAngles()
    assert.ok(
      (flipped['zuzu-lower-left'] ?? Infinity) < atRest['zuzu-lower-left']! - 0.3,
      'left bat must swing with the held left input',
    )
    assert.equal(flipped['zuzu-lower-right'], atRest['zuzu-lower-right'])
    physics.setFlipper('left', false)
    physics.setFlipper('right', true)
    run(22, () => physics.step())
    const switched = physics.flipperAngles()
    assert.ok(
      Math.abs(switched['zuzu-lower-left']! - atRest['zuzu-lower-left']!) < 0.04,
      'left bat returns to rest on release',
    )
    assert.ok(
      switched['zuzu-lower-right']! < atRest['zuzu-lower-right']! - 0.3,
      'right bat drives independently',
    )
  } finally {
    physics.dispose()
  }
}

// A River Croc capture must preserve the real ball's identity and safely
// reintroduce it after the timed hold, with no fabricated or drained balls.
{
  const physics = new PinballPhysics(RAPIER, table)
  try {
    const mouth = table.scoops.find((scoop) => scoop.id === 'croc-mouth')!
    const id = physics.serveBall(mouth.at as Vec3, [0, 0, 0])
    let captured = false
    let ejected = false
    let swallowedDrain = false
    // Check conservation at the instant of ejection. A ball is allowed to
    // drain later in ordinary free play; that is not a failed scoop return.
    for (let step = 0; step < PHYSICS_HZ * 3 && !ejected; step++) {
      for (const event of physics.step()) {
        if (event.type === 'capture' && event.id === mouth.id) captured = true
        if (event.type === 'eject' && event.id === mouth.id) ejected = true
        if (event.type === 'drain' && event.ballId === id && !ejected)
          swallowedDrain = true
      }
    }
    assert.ok(captured, 'Croc must actually capture a physical ball')
    assert.ok(ejected, 'Croc must safely eject its captive')
    assert.equal(swallowedDrain, false, 'a ball never drains during Croc hold')
    assert.equal(physics.ballCount, 1, 'Croc catch and release conserves the ball')
    assert.equal(physics.ballViews()[0]?.id, id)
  } finally {
    physics.dispose()
  }
}

assert.equal(livePhysicsWorlds(), 0, 'Zuzu Rapier worlds have no lifecycle leaks')
console.log('Zuzu physical shooter, lower flippers, trough and Croc transitions verified')
