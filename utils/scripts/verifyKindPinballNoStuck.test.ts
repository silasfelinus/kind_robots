// No stuck balls on AMI Village Rescue (conductor kind-pinball/t-035), and
// none for good on any table.
//
// 1. A ball dropped anywhere inside the arch, on a 3 cm grid, from a ball's
//    height under the glass (as one flying off a flip or a ramp lands), must
//    drain, drop into a scoop, sit on the plunger, rest on a flipper or keep
//    moving; one still trapped (resting, or rattling inside 2 cm) gets the
//    ball search's shakes and must be free after them.
// 2. The pocket a ball wedged in for good in play (2026-10-13: between the
//    upper feed's right rail and the lock pocket, beside AMI's post house)
//    and its mirror beside the spinner lane are roofed, and pinned below.
// 3. The runtime never lets a game hang on a stuck ball: one the search
//    cannot free is rescued to the plunger and fired, on both tables.
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { PHYSICS_HZ } from '../arcade/pinball/clock'
import {
  livePhysicsWorlds,
  PinballPhysics,
} from '../arcade/pinball/physics/world'
import { PinballRuntime } from '../arcade/pinball/runtime'
import { AMI_VILLAGE_GREYBOX as table } from '../arcade/pinball/tables/amiVillage/table'
import { ZUZU_RULESET } from '../arcade/pinball/tables/zuzuLastBell/rules'
import { ZUZU_LAST_BELL_GREYBOX } from '../arcade/pinball/tables/zuzuLastBell/table'
import type { RendererLike } from '../arcade/pinball/render/scene'
import type { TableDef, Vec3 } from '../arcade/pinball/types'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'

await RAPIER.init()

const TRAPPED = 0.02

/** Where a ball dropped at `at` ends: free, freed by the ball search, or stuck. */
function drop(at: Vec3): { end: 'free' | 'shaken' | 'stuck'; rest?: Vec3 } {
  const physics = new PinballPhysics(RAPIER, table)
  try {
    physics.serveBall(at, [0, 0, 0])
    let gone = false
    const step = () => {
      for (const e of physics.step())
        if (e.type === 'drain' || e.type === 'capture') gone = true
    }
    const run = (steps: number) => {
      for (let s = 0; s < steps && !gone; s++) step()
    }
    // Trapped: for a second it stays within 2 cm, off the flippers and plunger.
    const trapped = (): Vec3 | null => {
      const from = physics.ballViews()[0]?.position
      let wander = 0
      for (let s = 0; s < PHYSICS_HZ && !gone; s++) {
        step()
        const ball = physics.ballViews()[0]
        if (!ball || !from) return null
        wander = Math.max(
          wander,
          Math.hypot(ball.position[0] - from[0], ball.position[2] - from[2]),
        )
      }
      const ball = physics.ballViews()[0]
      if (gone || !ball || ball.captured || wander > TRAPPED) return null
      const [x, y, z] = ball.position
      // Cradled on a lower flipper, or waiting on the plunger: not stuck.
      if (z > -0.09 && Math.abs(x) < 0.2 && y < 0.02) return null
      if (physics.ballOnPlunger()) return null
      return ball.position
    }
    run(PHYSICS_HZ * 4)
    if (!trapped()) return { end: 'free' }
    for (let k = 0; k < 3; k++) {
      physics.nudge(k % 2 ? 0.1 : -0.1, -0.25)
      run(PHYSICS_HZ * 2)
      if (!trapped()) return { end: 'shaken' }
    }
    return { end: 'stuck', rest: trapped() ?? undefined }
  } finally {
    physics.dispose()
  }
}

/** Inside the top arch's half ellipse (the field ends there; see table.ts). */
function insideArch(x: number, z: number): boolean {
  const cx = 0.02
  const cz = -0.93 + 0.24
  if (z >= cz) return true
  return ((x - cx) / 0.28) ** 2 + ((z - cz) / 0.24) ** 2 < 0.92
}

// --- 1. The grid over the main field, from 9.5 cm up -----------------------
const stuck: string[] = []
let drops = 0
let shaken = 0
for (let x = -0.24; x <= 0.29; x += 0.03) {
  for (let z = -0.92; z <= -0.08; z += 0.03) {
    if (!insideArch(x, z)) continue
    drops++
    const result = drop([x, 0.095, z])
    if (result.end === 'shaken') shaken++
    if (result.end === 'stuck')
      stuck.push(
        `(${x.toFixed(2)}, ${z.toFixed(2)}) rests at ${result.rest?.map((v) => v.toFixed(3)).join(', ')}`,
      )
  }
}
assert.deepEqual(stuck, [], 'no ball is stuck for good anywhere on the table')
assert.ok(shaken <= drops * 0.04, `few need the ball search (${shaken})`)

// --- 2. The pockets found in play, and their roofs -------------------------
// Each drop lands where a ball hopping in from the feed, the lock lane or
// the spinner lane came down; before the roofs every one wedged for good.
for (const at of [
  [-0.041, 0.07, -0.412],
  [-0.037, 0.07, -0.365],
  [0, 0.08, -0.445],
  [0.105, 0.09, -0.417],
  [0.12, 0.09, -0.47],
] as Vec3[]) {
  const result = drop(at)
  assert.notEqual(result.end, 'stuck', `no longer stuck at ${at.join(', ')}`)
}
for (const id of ['pocket-roof-left', 'pocket-roof-right'])
  assert.ok(
    table.colliders.some((c) => c.id === id),
    id,
  )
assert.equal(livePhysicsWorlds(), 0)

// --- 3. The runtime rescues what the search cannot free --------------------
function stubRenderer(): RendererLike {
  return {
    render: () => {},
    setSize: () => {},
    setPixelRatio: () => {},
    dispose: () => {},
  }
}

/**
 * The game's ball is wedged where no shake can free it (`at`; held there,
 * as in a pocket the geometry has not caught). Within 20 s of game time it
 * is back on the plunger and fired up the lane, the DMD says so, and the
 * game goes on with the ball still in play.
 */
function rescue(
  name: string,
  def: TableDef,
  at: Vec3,
  ruleset?: ConstructorParameters<typeof PinballRuntime>[4],
) {
  const runtime = new PinballRuntime(
    { rng: mulberry32(7), sound: { play: () => {} }, demo: false, hiScore: 0 },
    RAPIER,
    def,
    stubRenderer,
    ruleset,
  )
  type Body = { setTranslation(v: object, wake: boolean): void }
  const physics = (runtime as unknown as { physics: PinballPhysics }).physics
  const balls = (physics as unknown as { balls: { id: number; body: Body }[] })
    .balls
  // The ball the game served, taken off the plunger and wedged.
  const { id, body } = balls[0]!
  const wedge = () =>
    body.setTranslation({ x: at[0], y: at[1], z: at[2] }, true)
  wedge()
  const lane = def.plunger.rest
  const texts = new Set<string>()
  let rescued = false
  let launched = false
  for (let tick = 0; tick < 60 * 20 && !launched; tick++) {
    const ball = physics.ballViews().find((b) => b.id === id)
    assert.ok(ball, `${name}: the stuck ball is never lost`)
    const [x, , z] = ball.position
    if (!rescued && Math.hypot(x - lane[0], z - lane[2]) < 0.03) rescued = true
    if (!rescued) wedge()
    if (rescued && z < lane[2] - 0.15) launched = true
    runtime.update(emptyInput())
    const text = runtime.dmdQueue.showing?.request.text
    if (text) texts.add(text)
  }
  assert.ok(rescued, `${name}: the stuck ball is set back on the plunger`)
  assert.ok(launched, `${name}: ...and fired up the lane`)
  assert.ok(texts.has('BALL RESCUED'), `${name}: the DMD says BALL RESCUED`)
  assert.equal(runtime.lives, def.balls, `${name}: no ball is charged for it`)
  assert.ok(!runtime.over, `${name}: the game goes on`)
  runtime.dispose()
}

// Behind AMI's arch, in the dead corner by the secret chamber: walled in
// on every side, so only the rescue gets a ball out.
rescue('AMI Village', table, [-0.156, 0.0136, -0.897])
// Zuzu's table runs the same search.
rescue(
  'Zuzu',
  ZUZU_LAST_BELL_GREYBOX,
  [-0.1, 0.0136, -0.5],
  ZUZU_RULESET as unknown as ConstructorParameters<typeof PinballRuntime>[4],
)

assert.equal(livePhysicsWorlds(), 0)
console.log(
  `No stuck balls (AMI Village): ${drops} drops inside the arch, ${shaken} freed by the ball search, none stuck; a ball the search cannot free is rescued on both tables`,
)
