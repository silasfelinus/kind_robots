// The Last Bell's camera sweeps (conductor zuzu-pinball/t-012): over the
// shooter lane while the ball waits on the plunger, pulled back over the
// whole field in a multiball, and back to the flippers. Every sweep frames
// the whole playfield, so the flippers never leave the screen, and the
// physics is the same tick for tick whatever the camera does: a sweep never
// costs a flip. The player's still camera never sweeps and cuts instead of
// panning; the cabinet defaults it on for prefers-reduced-motion.
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { mulberry32 } from '../arcade/curve'
import type { BallView, PinballPhysics } from '../arcade/pinball/physics/world'
import type { PinballScene, RendererLike } from '../arcade/pinball/render/scene'
import {
  cameraViewFor,
  PinballRuntime,
  SWEEP_HOLD_TICKS,
  sweepViewFor,
} from '../arcade/pinball/runtime'
import { AMI_VILLAGE_GREYBOX } from '../arcade/pinball/tables/amiVillage/table'
import { ZUZU_RULESET } from '../arcade/pinball/tables/zuzuLastBell/rules'
import { ZUZU_LAST_BELL_GREYBOX as table } from '../arcade/pinball/tables/zuzuLastBell/table'
import { emptyInput, type InputFrame } from '../arcade/types'

await RAPIER.init()

const ball = (id: number, zone?: string): BallView => ({
  id,
  position: [0, 0.0135, -0.3],
  rotation: [0, 0, 0, 1],
  velocity: [0, 0, 0],
  speed: 0,
  captured: false,
  zone,
})

// Which view the balls call for.
{
  const cams = table.cameras
  assert.equal(sweepViewFor([], false, cams, false), 'main')
  assert.equal(sweepViewFor([ball(1)], true, cams, false), 'plunge')
  assert.equal(sweepViewFor([ball(1)], false, cams, false), 'main')
  assert.equal(
    sweepViewFor([ball(1), ball(2)], false, cams, false),
    'multiball',
  )
  assert.equal(
    sweepViewFor([ball(1), ball(2)], true, cams, false),
    'multiball',
    'a multiball ball on the plunger: still the multiball view',
  )
  assert.equal(
    sweepViewFor([ball(1, 'sub-table')], false, cams, false),
    'sub-table',
    'the crypt wins over any sweep',
  )
  // A still camera never sweeps, but must still follow a ball below.
  for (const balls of [[ball(1)], [ball(1), ball(2)], []])
    for (const plunger of [false, true])
      assert.equal(sweepViewFor(balls, plunger, cams, true), 'main')
  assert.equal(
    sweepViewFor([ball(1, 'sub-table')], false, cams, true),
    'sub-table',
  )
  // Kind Pinball has no sweep presets: its views are unchanged.
  const kp = AMI_VILLAGE_GREYBOX.cameras
  for (const balls of [[ball(1)], [ball(1), ball(2)], [ball(1, 'ridge')]])
    for (const plunger of [false, true])
      assert.equal(
        sweepViewFor(balls, plunger, kp, false),
        cameraViewFor(balls),
      )
}

// Every sweep frames the whole playfield: the lower flippers are on screen.
{
  const main = table.cameras.find((c) => c.id === 'main')!
  for (const id of ['plunge', 'multiball'] as const) {
    const preset = table.cameras.find((c) => c.id === id)
    assert.ok(preset, `the Last Bell has a ${id} view`)
    for (const f of table.flippers.filter((f) =>
      f.id.startsWith('zuzu-lower'),
    )) {
      const [x, , z] = f.pivot
      assert.ok(
        x >= preset.frame.min[0] &&
          x <= preset.frame.max[0] &&
          z >= preset.frame.min[2] &&
          z <= preset.frame.max[2],
        `${id} keeps ${f.id} in frame`,
      )
    }
    assert.deepEqual(preset.frame, main.frame, `${id} frames what main does`)
  }
}

const headless = () =>
  ({
    render() {},
    setSize() {},
    setPixelRatio() {},
    dispose() {},
  }) as unknown as RendererLike
type Inner = { physics: PinballPhysics; scene: PinballScene }
const runtimeFor = (stillCamera: boolean) => {
  const runtime = new PinballRuntime(
    {
      rng: mulberry32(7),
      sound: { play: () => {} },
      demo: false,
      hiScore: 0,
      stillCamera,
    },
    RAPIER,
    table,
    headless,
    ZUZU_RULESET,
  )
  runtime.mount({} as HTMLCanvasElement)
  return { runtime, inner: runtime as unknown as Inner }
}
const press = (
  held: Partial<InputFrame['held']>,
  pressed: Partial<InputFrame['pressed']> = {},
): InputFrame => {
  const frame = emptyInput()
  return {
    ...frame,
    held: { ...frame.held, ...held },
    pressed: { ...frame.pressed, ...pressed },
  }
}

// A game: the ball waits on the plunger (the lane view), is launched, and
// the camera comes back to the flippers.
{
  const { runtime, inner } = runtimeFor(false)
  runtime.update(emptyInput())
  assert.ok(inner.physics.ballOnPlunger(), 'the ball waits on the plunger')
  assert.equal(inner.scene.cameraView, 'main', 'not at once')
  for (let t = 0; t < SWEEP_HOLD_TICKS; t++) runtime.update(emptyInput())
  assert.equal(inner.scene.cameraView, 'plunge', 'the lane view')
  assert.ok(inner.scene.panning, 'it pans there')
  for (let t = 0; t < 30; t++) runtime.update(press({ down: true }))
  runtime.update(emptyInput())
  let back = -1
  for (let t = 0; t < 240 && back < 0; t++) {
    runtime.update(emptyInput())
    if (inner.scene.cameraView === 'main') back = t
  }
  assert.ok(back >= 0, 'back to the flippers once the ball is away')
  assert.ok(
    back >= SWEEP_HOLD_TICKS - 32,
    `after the lane view has held (${back} ticks)`,
  )
  runtime.dispose()
}

// Still camera: no sweep, and no pan, ever; switching mid-game cuts.
{
  const { runtime, inner } = runtimeFor(true)
  runtime.update(emptyInput())
  assert.ok(inner.physics.ballOnPlunger())
  assert.equal(inner.scene.cameraView, 'main', 'no lane sweep')
  assert.ok(!inner.scene.panning)
  runtime.setStillCamera(false)
  for (let t = 0; t <= SWEEP_HOLD_TICKS; t++) runtime.update(emptyInput())
  assert.equal(inner.scene.cameraView, 'plunge', 'moving again: it sweeps')
  assert.ok(inner.scene.panning)
  runtime.setStillCamera(true)
  assert.ok(!inner.scene.panning, 'still: the pan stops where it is')
  runtime.update(emptyInput())
  assert.equal(inner.scene.cameraView, 'main', 'and cuts back')
  assert.ok(!inner.scene.panning, 'a cut, not a pan')
  runtime.dispose()
}

// A sweep never costs a flip: the same inputs give the same physics,
// tick for tick, whether the camera moves or holds still.
{
  const moving = runtimeFor(false)
  const still = runtimeFor(true)
  let panned = 0
  for (let t = 0; t < 60 * 12; t++) {
    const phase = t % 50
    // Flipping while the camera sweeps to the lane, then a plunge, then
    // flipping while it comes home.
    const input =
      t >= 100 && t < 140
        ? press({ down: true })
        : press(
            { left: phase < 12, right: phase >= 25 && phase < 37 },
            { left: phase === 0, right: phase === 25 },
          )
    moving.runtime.update(input)
    still.runtime.update(input)
    if (moving.inner.scene.panning) panned++
    assert.deepEqual(
      moving.inner.physics.flipperAngles(),
      still.inner.physics.flipperAngles(),
      `tick ${t}: flippers alike`,
    )
    assert.deepEqual(
      moving.inner.physics.ballViews().map((b) => b.position),
      still.inner.physics.ballViews().map((b) => b.position),
      `tick ${t}: balls alike`,
    )
    if (moving.runtime.over) break
  }
  assert.ok(panned > 0, 'the moving camera did pan meanwhile')
  moving.runtime.dispose()
  still.runtime.dispose()
}

// A multiball pulls the camera back, and draining to one ball brings it
// home; a ball drained and re-served at once does not swing it.
{
  const { runtime, inner } = runtimeFor(false)
  const views = (balls: BallView[], plunger: boolean) => {
    const physics = inner.physics as unknown as {
      ballViews: () => BallView[]
      ballOnPlunger: () => boolean
    }
    physics.ballViews = () => balls
    physics.ballOnPlunger = () => plunger
  }
  const run = (n: number) => {
    for (let t = 0; t < n; t++) runtime.update(emptyInput())
  }
  // (The physics' answers are pinned; the runtime still steps it.)
  views([ball(1), ball(2), ball(3)], false)
  run(SWEEP_HOLD_TICKS + 2)
  assert.equal(inner.scene.cameraView, 'multiball', 'pulled back')
  views([ball(1)], false)
  run(3)
  views([ball(1), ball(2)], true)
  run(3)
  assert.equal(inner.scene.cameraView, 'multiball', 'no swing on a re-serve')
  views([ball(1)], false)
  run(SWEEP_HOLD_TICKS + 2)
  assert.equal(inner.scene.cameraView, 'main', 'one ball: the flippers')
  views([ball(1, 'sub-table')], false)
  run(1)
  assert.equal(inner.scene.cameraView, 'sub-table', 'a bonus area at once')
  runtime.dispose()
}

console.log(
  'Zuzu camera: lane and multiball sweeps framing the flippers, crypt view first, held views, still camera cuts, physics identical either way, Kind Pinball views unchanged',
)
