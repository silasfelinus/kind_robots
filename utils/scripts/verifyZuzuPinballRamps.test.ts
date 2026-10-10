import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { ZUZU_LAST_BELL_GREYBOX as table, ZUZU_RAMP_PATHS } from '../arcade/pinball/tables/zuzuLastBell/table'
import { PinballPhysics, livePhysicsWorlds } from '../arcade/pinball/physics/world'
import { initialShotProgress, recognizeShots } from '../arcade/pinball/rules/shots'
import type { Vec3 } from '../arcade/pinball/types'

await RAPIER.init()

const rampNames = ['village-switchback', 'abbey-crossover', 'bell-spiral'] as const
const radius = table.physical.ballRadiusM
assert.deepEqual(
  table.shots.filter((shot) => shot.kind === 'ramp').map((shot) => shot.id),
  rampNames,
)
assert.equal(table.shots.filter((shot) => shot.kind === 'orbit').length, 2)
assert.ok(table.colliders.some((c) => c.id === 'left-orbit-guide'))
assert.ok(table.colliders.some((c) => c.id === 'right-orbit-guide'))
assert.ok(table.colliders.some((c) => c.id === 'left-orbit-return' && c.kind === 'box' && !!c.passDir))
assert.ok(table.colliders.some((c) => c.id === 'right-orbit-return' && c.kind === 'box' && !!c.passDir))

const [village, abbey, bell] = rampNames.map((id) => ZUZU_RAMP_PATHS[id])
assert.ok(village![0]![0] < 0 && village!.at(-1)![0] > 0, 'Village switchback returns across the playfield')
assert.ok(abbey![0]![0] > 0 && abbey!.at(-1)![0] < 0, 'Abbey crossover returns to left inlane')
assert.ok(Math.max(...bell!.map((p) => p[2])) >= 0.09, 'Bell spiral truly rises above the cabinet')

for (const id of rampNames) {
  const path = ZUZU_RAMP_PATHS[id]
  const floor = table.colliders.find((c) => c.id === `${id}-floor`)
  const rails = table.colliders.filter((c) => c.id.startsWith(`${id}-rail-`))
  const cover = table.colliders.find((c) => c.id === `${id}-cover`)
  assert.ok(floor?.kind === 'mesh', `${id} must have a physical Rapier floor`)
  assert.equal(rails.length, 2, `${id} must retain both guard rails`)
  assert.ok(rails.every((c) => c.kind === 'mesh' && c.twoSided), 'Rails collide from either side')
  assert.ok(cover?.kind === 'mesh', `${id} needs an anti-flyoff roof`)
  assert.ok(floor.vertices.length > 100, `${id} is a continuous sampled mesh`)
  assert.ok(floor.indices.length >= 100, `${id} has collision triangles`)
  assert.ok(floor.mouth, `${id} has a flat-entry collision hook`)
  assert.ok(path[0]![2] === 0 && path.some((p) => p[2] > 0.04))
  assert.ok(path.at(-1)![2] >= 0.03, `${id} needs raised exit clearance`)
  assert.ok(
    path.every(([x, z, y]) => x >= -0.255 && x <= 0.235 && z >= -0.97 && z <= 0.14 && y >= 0 && y < 0.27),
    `${id} centreline must remain within physical cabinet envelope`,
  )
  const shot = table.shots.find((s) => s.id === id)!
  assert.equal(shot.sensors.length, 3, `${id} requires entry, crest and return switches`)
  for (const sensorId of shot.sensors) {
    assert.ok(table.sensors.some((s) => s.id === sensorId), `${sensorId} must be a real Rapier sensor`)
  }
  // The actual shot recognizer only pays the full ramp when the same ball
  // trips the entry, high deck and return in that order. Reverse is not a made shot.
  let progress = initialShotProgress()
  let completed = []
  for (const [tick, switchId] of shot.sensors.entries()) {
    const result = recognizeShots([shot], progress, { type: 'sensor-enter', id: switchId, ballId: 1 }, tick * 80, 1.7)
    progress = result.progress
    completed.push(...result.completed)
  }
  assert.deepEqual(completed.map((c) => c.shotId), [id])
  progress = initialShotProgress()
  completed = []
  for (const [tick, switchId] of [...shot.sensors].reverse().entries()) {
    const result = recognizeShots([shot], progress, { type: 'sensor-enter', id: switchId, ballId: 2 }, tick * 80, 1.7)
    progress = result.progress
    completed.push(...result.completed)
  }
  assert.equal(completed.length, 0, 'Wrong-way descent never awards a ramp')
}

// A real ball needs room between crossing decks. A 27mm ball cannot roll
// through two ramps at the same height, and the clear roofs demand more than
// the ball diameter. Sample all 3D centrelines to reject impossible crossings.
const sampled = (path: ReadonlyArray<readonly [number, number, number]>) => {
  const points: Vec3[] = []
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!
    const b = path[i + 1]!
    const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.006)
    for (let k = 0; k < steps; k++) {
      const t = k / steps
      points.push([a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t, a[1] + (b[1] - a[1]) * t])
    }
  }
  return points
}
for (let i = 0; i < rampNames.length; i++) {
  for (let j = i + 1; j < rampNames.length; j++) {
    for (const a of sampled(ZUZU_RAMP_PATHS[rampNames[i]!])) {
      for (const b of sampled(ZUZU_RAMP_PATHS[rampNames[j]!])) {
        if (Math.hypot(a[0] - b[0], a[2] - b[2]) >= 0.04) continue
        assert.ok(
          Math.abs(a[1] - b[1]) > 0.04,
          `Dangerous same-level crossing between ${rampNames[i]} and ${rampNames[j]}`,
        )
      }
    }
  }
}

const croc = table.scoops.find((scoop) => scoop.id === 'croc-mouth')!
for (const point of sampled(ZUZU_RAMP_PATHS['village-switchback'])) {
  const closeToMouth = Math.hypot(point[0] - croc.at[0], point[2] - croc.at[2]) < 0.05
  assert.ok(!closeToMouth || point[1] > 0.05, 'Village ramp must not plug the Croc aiming lane')
}

// A physical rolling steel ball must remain on the table when introduced
// above the raised deck and advance in real Rapier steps, not pass through
// an uncollidable picture or lose its ball id.
for (const id of rampNames) {
  const path = ZUZU_RAMP_PATHS[id]
  const at = Math.floor(path.length / 2)
  const point = path[at]!
  const next = path[at + 1]!
  const dx = next[0] - point[0]
  const dz = next[1] - point[1]
  const d = Math.hypot(dx, dz)
  const start: Vec3 = [point[0], point[2] + radius + 0.004, point[1]]
  const physics = new PinballPhysics(RAPIER, table)
  try {
    const ballId = physics.serveBall(start, [(dx / d) * 1.1, 0, (dz / d) * 1.1])
    let last: Vec3 = start
    for (let tick = 0; tick < 24; tick++) {
      physics.step()
      const view = physics.ballViews().find((b) => b.id === ballId)
      assert.ok(view, `${id}: ball survives the raised deck`)
      assert.ok(view.position.every(Number.isFinite), `${id}: no NaN in physical trajectory`)
      last = view.position
    }
    const travelled = Math.hypot(last[0] - start[0], last[2] - start[2])
    assert.ok(travelled > 0.008, `${id}: real ball rolls along an elevated deck`)
    assert.equal(physics.ballCount, 1, `${id}: shot does not manufacture or swallow balls`)
  } finally {
    physics.dispose()
  }
}

assert.equal(livePhysicsWorlds(), 0, 'Every ramp sweep disposes its Rapier world')
console.log('Zuzu three elevated ramps, orbit returns, shot-order and Rapier sweeps verified')
