// No stuck balls (conductor zuzu-pinball/t-013): a ball dropped anywhere on
// the main playfield, on a 3 cm grid, must drain, drop into a scoop, sit on
// the plunger, rest on a flipper or keep moving; a ball still at rest
// elsewhere gets the machine's ball search (up to three shakes, as the
// runtime gives it) and must be free after that. The spots the first scan
// found, and the remedies for them, are pinned below so a geometry change
// cannot quietly bring one back.
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { PHYSICS_HZ } from '../arcade/pinball/clock'
import {
  livePhysicsWorlds,
  PinballPhysics,
} from '../arcade/pinball/physics/world'
import { ZUZU_LAST_BELL_GREYBOX as table } from '../arcade/pinball/tables/zuzuLastBell/table'
import type { Vec3 } from '../arcade/pinball/types'

await RAPIER.init()

const STILL = 0.02

/** Where a ball dropped at `at` ends: free, freed by the ball search, or stuck. */
function drop(at: Vec3): { end: 'free' | 'shaken' | 'stuck'; rest?: Vec3 } {
  const physics = new PinballPhysics(RAPIER, table)
  try {
    physics.serveBall(at, [0, 0, 0])
    let gone = false
    const run = (steps: number) => {
      for (let s = 0; s < steps && !gone; s++)
        for (const e of physics.step())
          if (e.type === 'drain' || e.type === 'capture') gone = true
    }
    const resting = () => {
      const ball = physics.ballViews()[0]
      if (gone || !ball || ball.captured || ball.speed > STILL) return null
      const [x, y, z] = ball.position
      // Cradled on a lower flipper, or waiting on the plunger: not stuck.
      if (z > -0.09 && Math.abs(x) < 0.2 && y < 0.02) return null
      if (physics.ballOnPlunger()) return null
      return ball.position
    }
    run(PHYSICS_HZ * 4)
    if (!resting()) return { end: 'free' }
    for (let k = 0; k < 3; k++) {
      physics.nudge(k % 2 ? 0.1 : -0.1, -0.25)
      run(PHYSICS_HZ * 2)
      if (!resting()) return { end: 'shaken' }
    }
    return { end: 'stuck', rest: resting() ?? undefined }
  } finally {
    physics.dispose()
  }
}

// The grid over the whole main playfield, dropped from above every wall.
const stuck: string[] = []
let drops = 0
let shaken = 0
for (let x = -0.24; x <= 0.29; x += 0.03) {
  for (let z = -0.94; z <= -0.08; z += 0.03) {
    drops++
    const result = drop([x, 0.06, z])
    if (result.end === 'shaken') shaken++
    if (result.end === 'stuck')
      stuck.push(
        `(${x.toFixed(2)}, ${z.toFixed(2)}) rests at ${result.rest?.map((v) => v.toFixed(3)).join(', ')}`,
      )
  }
}
assert.deepEqual(stuck, [], 'no ball is stuck for good anywhere on the table')
assert.ok(shaken <= drops * 0.02, `few need the ball search (${shaken})`)

// The spots the first scan found, each with its remedy (t-013):
//  - perched between the Village ramp's rail and the relic lane's wall,
//    pinched by a tall mouth post: the posts are as low as the walls now,
//    and a clear roof covers the lane;
//  - balanced on the sling's flat top end above the right inlane: a round
//    post caps each sling's top corner;
//  - stopped dead against the relic lane's flat back wall: a deflector
//    behind the lane turns a ball out past its right side;
//  - perched on a standing seal: the same clear roof covers the seals.
for (const at of [
  // (dropped from above, as a ball reaches it: the sliver is now covered)
  [-0.082, 0.075, -0.415],
  [-0.085, 0.075, -0.43],
  [0.165, 0.03, -0.235],
  [-0.06, 0.03, -0.55],
  [-0.06, 0.07, -0.37],
] as Vec3[]) {
  const result = drop(at)
  assert.notEqual(result.end, 'stuck', `no longer stuck at ${at.join(', ')}`)
}
const post = table.colliders.find((c) => c.id === 'relic-mouth-l')
assert.ok(post?.kind === 'post' && post.at[1] + post.halfHeight <= 0.027)
for (const id of [
  'sling-left-top',
  'sling-right-top',
  'relic-deflector',
  'relic-seal-roof',
])
  assert.ok(
    table.colliders.some((c) => c.id === id),
    id,
  )

assert.equal(livePhysicsWorlds(), 0)
console.log(
  `No stuck balls: ${drops} drops across the table, ${shaken} freed by the ball search, none stuck`,
)
