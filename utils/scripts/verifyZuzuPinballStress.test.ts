// The Last Bell under load (conductor zuzu-pinball/t-013): the whole
// runtime, not just the physics. Mounted, played, rendered and disposed
// over and over, nothing leaks: no physics world, no GPU resource. And six
// balls at once (The Last Bell's wizard multiball) through the rules, the
// scene, the LED rail and the trails, flipped by a bot for a minute of game
// time: never more than six, none lost through a wall, and the tick's cost
// (update and render, headless) reported so a regression shows.
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import RAPIER from '@dimforge/rapier3d-compat'
import { mulberry32 } from '../arcade/curve'
import {
  livePhysicsWorlds,
  type PinballPhysics,
} from '../arcade/pinball/physics/world'
import {
  liveRenderResources,
  type RendererLike,
} from '../arcade/pinball/render/scene'
import { PinballRuntime } from '../arcade/pinball/runtime'
import { BALLS_INSTALLED } from '../arcade/pinball/tables/zuzuLastBell/multiball'
import {
  ZUZU_RULESET,
  type ZuzuRulesState,
} from '../arcade/pinball/tables/zuzuLastBell/rules'
import { ZUZU_LAST_BELL_GREYBOX as table } from '../arcade/pinball/tables/zuzuLastBell/table'
import { BOT_SKILLS, PinballBot } from '../arcade/pinball/tuning/bot'
import { emptyInput } from '../arcade/types'

await RAPIER.init()

const log = { frames: 0, disposed: 0 }
const headless = () =>
  ({
    render: () => void log.frames++,
    setSize() {},
    setPixelRatio() {},
    dispose: () => void log.disposed++,
  }) as unknown as RendererLike
type Inner = { physics: PinballPhysics; rules: ZuzuRulesState }
const make = (seed: number, demo: boolean) =>
  new PinballRuntime(
    { rng: mulberry32(seed), sound: { play: () => {} }, demo, hiScore: 0 },
    RAPIER,
    table,
    headless,
    ZUZU_RULESET,
  )

// Setup and dispose, 25 times: demo and real games, every scene built and
// freed, a second dispose harmless, an update after dispose a no-op.
{
  const worlds = livePhysicsWorlds()
  const resources = liveRenderResources()
  const cycles = 25
  for (let cycle = 0; cycle < cycles; cycle++) {
    const runtime = make(cycle + 1, cycle % 2 === 0)
    runtime.resize(cycle % 3 ? 390 : 1280, cycle % 3 ? 844 : 720, 2)
    runtime.mount({} as HTMLCanvasElement)
    assert.ok(liveRenderResources() > resources, 'the scene builds')
    for (let t = 0; t < 180; t++) {
      const frame = emptyInput()
      frame.held.down = t < 30
      frame.held.left = t % 40 < 8
      frame.held.right = t % 40 >= 20 && t % 40 < 28
      runtime.update(frame)
      if (t % 3 === 0) runtime.render()
    }
    runtime.dispose()
    runtime.dispose()
    runtime.update(emptyInput())
    runtime.render()
    assert.equal(livePhysicsWorlds(), worlds, `cycle ${cycle}: no world left`)
    assert.equal(
      liveRenderResources(),
      resources,
      `cycle ${cycle}: every GPU resource freed`,
    )
  }
  assert.equal(log.disposed, cycles, 'each renderer disposed once')
  console.log(`  ${cycles} mount/play/dispose cycles, nothing leaked`)
}

// Six balls: The Last Bell's six-ball multiball through the whole runtime,
// a minute of it on each of three seeds.
for (const seed of [6, 7, 8]) {
  const runtime = make(seed, false)
  runtime.resize(390, 844, 2)
  runtime.mount({} as HTMLCanvasElement)
  const inner = runtime as unknown as Inner
  const bot = new PinballBot(BOT_SKILLS.average, mulberry32(seed * 11), null)
  const tick = () =>
    runtime.update(
      bot.frame({
        balls: inner.physics.ballViews(),
        rules: inner.rules as never,
        ballOnPlunger: inner.physics.ballOnPlunger(),
        flippers: table.flippers,
      }),
    )
  // Plunge the first ball, then let the wizard mode start around it.
  for (let t = 0; t < 120; t++) tick()
  inner.rules = {
    ...inner.rules,
    ballsInPlay: BALLS_INSTALLED,
    multiball: {
      ...inner.rules.multiball,
      kind: 'last-bell',
      saveUntil: Number.POSITIVE_INFINITY,
    },
  }
  // Five more balls dropped across the upper field, as the Citadel and
  // the plunger would put them there.
  for (let i = 1; i < BALLS_INSTALLED; i++)
    inner.physics.serveBall(
      [-0.15 + i * 0.06, table.physical.ballRadiusM + 0.0005, -0.62],
      [0, 0, 0.3],
    )
  const BOUNDS = { x: [-0.32, 0.36], z: [-1.6, 0.25] }
  const ticks = 60 * 60
  const cost: number[] = []
  let most = 0
  let sixFor = 0
  for (let t = 0; t < ticks && !runtime.over; t++) {
    const start = performance.now()
    tick()
    runtime.render()
    cost.push(performance.now() - start)
    const balls = inner.physics.ballViews()
    most = Math.max(most, inner.physics.ballCount)
    if (inner.physics.ballCount === BALLS_INSTALLED) sixFor++
    for (const ball of balls) {
      const [x, y, z] = ball.position
      assert.ok(
        [x, y, z].every(Number.isFinite),
        `tick ${t}: a ball at a real place`,
      )
      assert.ok(
        x > BOUNDS.x[0] &&
          x < BOUNDS.x[1] &&
          z > BOUNDS.z[0] &&
          z < BOUNDS.z[1],
        `tick ${t}: ball ${ball.id} inside the cabinet (${x.toFixed(3)}, ${z.toFixed(3)})`,
      )
    }
    // Keep it a six-ball mode: the save hands back every drain.
    inner.rules = {
      ...inner.rules,
      multiball: {
        ...inner.rules.multiball,
        saveUntil: Number.POSITIVE_INFINITY,
      },
    }
  }
  assert.ok(most <= BALLS_INSTALLED, `never more than six (${most})`)
  assert.equal(most, BALLS_INSTALLED, 'six at once')
  assert.ok(sixFor > 60, `six balls in play for a while (${sixFor} ticks)`)
  const sorted = [...cost].sort((a, b) => a - b)
  const mean = cost.reduce((a, b) => a + b, 0) / cost.length
  const p95 = sorted[Math.floor(sorted.length * 0.95)]!
  const worst = sorted.at(-1)!
  console.log(
    `  seed ${seed}, six balls: ${cost.length} ticks, ${sixFor} with all six; update+render mean ${mean.toFixed(2)} ms, p95 ${p95.toFixed(2)} ms, worst ${worst.toFixed(1)} ms (headless)`,
  )
  // A 60 Hz frame is 16.7 ms; the physics and rules must leave most of it
  // to the GPU even on a slow CI runner.
  assert.ok(mean < 8, `a tick costs ${mean.toFixed(2)} ms on average`)
  runtime.dispose()
}

assert.equal(livePhysicsWorlds(), 0)
console.log(
  'Zuzu stress: setup/dispose cycles leak-free, six balls through the runtime, scene and LEDs inside the cabinet, tick cost measured',
)
