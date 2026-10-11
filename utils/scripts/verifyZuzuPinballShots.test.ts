// Flipper-origin shot evidence for the private Zuzu table (conductor
// zuzu-pinball/t-005): every named shot is made by a real flip on the real
// Rapier physics, ramps return the ball to the inlane they promise, the lower
// field feeds the flippers, and bot play never strands a ball.
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { mulberry32 } from '../arcade/curve'
import { PHYSICS_HZ } from '../arcade/pinball/clock'
import {
  PinballPhysics,
  livePhysicsWorlds,
} from '../arcade/pinball/physics/world'
import {
  initialShotProgress,
  recognizeShots,
} from '../arcade/pinball/rules/shots'
import { PinballRuntime } from '../arcade/pinball/runtime'
import {
  INLANE_GUIDE,
  SLING_BACK,
  ZUZU_LAST_BELL_GREYBOX as table,
} from '../arcade/pinball/tables/zuzuLastBell/table'
import {
  AIM_HOLD_TICKS,
  cradle,
  inlane,
  type Feed,
  type FlipperSide,
} from '../arcade/pinball/tuning/aim'
import { ZUZU_RULESET } from '../arcade/pinball/tables/zuzuLastBell/rules'
import { BOT_SKILLS, PinballBot } from '../arcade/pinball/tuning/bot'
import type { RendererLike } from '../arcade/pinball/render/scene'
import type { SwitchEvent } from '../arcade/pinball/types'

await RAPIER.init()

const STEPS_PER_TICK = PHYSICS_HZ / 60
const BALL = table.physical.ballRadiusM

type Flight = {
  shots: string[]
  events: SwitchEvent[]
  /** Where the ball first crossed back into the lower field after its shot. */
  landed: [number, number] | null
  drained: boolean
}

/** One measured flip: feed the ball, flip after `delay` ticks, follow it. */
function flip(side: FlipperSide, feed: Feed, delay: number): Flight {
  const physics = new PinballPhysics(RAPIER, table)
  try {
    if (feed === 'cradle') {
      cradle(physics, side)
      physics.setFlipper(side, false)
    } else {
      inlane(physics, side)
    }
    const flight: Flight = {
      shots: [],
      events: [],
      landed: null,
      drained: false,
    }
    let progress = initialShotProgress()
    let step = 0
    let wentUp = false
    for (let t = 0; t < delay + 60 * 6 && !flight.drained; t++) {
      if (t === delay) physics.setFlipper(side, true)
      if (t === delay + AIM_HOLD_TICKS) physics.setFlipper(side, false)
      for (let k = 0; k < STEPS_PER_TICK; k++) {
        step++
        for (const event of physics.step()) {
          if (t < delay) continue
          flight.events.push(event)
          if (event.type === 'drain') flight.drained = true
          const r = recognizeShots(table.shots, progress, event, step)
          progress = r.progress
          flight.shots.push(...r.completed.map((c) => c.shotId))
        }
      }
      const ball = physics.ballViews()[0]
      if (!ball) break
      if (ball.position[2] < -0.3) wentUp = true
      if (wentUp && flight.shots.length && !flight.landed)
        if (ball.position[2] > -0.17 && ball.position[1] < BALL * 1.5)
          flight.landed = [ball.position[0], ball.position[2]]
    }
    return flight
  } finally {
    physics.dispose()
  }
}

// One measured flip per shot. Each was found with the aiming chart
// (tuning/aim.ts measureAimChart) and is the evidence that the shot is
// physically makeable from a flipper, not only drawn on the mockup. The
// cross-table shots come from the far flipper, as a player would take them.
const PROOF: Array<[string, FlipperSide, Feed, number]> = [
  ['village-switchback', 'right', 'cradle', 49],
  ['abbey-crossover', 'left', 'cradle', 49],
  ['bell-spiral', 'left', 'cradle', 42],
  ['left-orbit', 'right', 'cradle', 50],
  ['right-orbit', 'left', 'inlane', 55],
  ['croc-mouth', 'right', 'cradle', 34],
  ['mortuary', 'right', 'cradle', 22],
  ['bell-lane', 'right', 'cradle', 30],
  ['relic-spinner', 'right', 'cradle', 21],
]
assert.deepEqual(
  [...PROOF.map(([shot]) => shot)].sort(),
  table.shots.map((s) => s.id).sort(),
  'every shot on the table has a flipper-origin proof',
)

const flights = new Map<string, Flight>()
for (const [shot, side, feed, delay] of PROOF) {
  const flight = flip(side, feed, delay)
  flights.set(shot, flight)
  assert.ok(
    flight.shots.includes(shot),
    `${shot}: a ${feed} ${side} flip at ${delay} ticks makes it (made ${flight.shots.join(', ') || 'nothing'})`,
  )
}

// A ramp is made only when the same ball trips entry, crest and return in
// order, so the shots above already prove the ball climbed each one. Each
// ramp then has to bring the ball back down where the brief says.
const inlaneOf = (x: number) =>
  x < 0
    ? x > INLANE_GUIDE.left && x < -SLING_BACK
    : x < INLANE_GUIDE.right && x > SLING_BACK
const village = flights.get('village-switchback')!
assert.ok(village.landed, 'the Village switchback returns its ball')
assert.ok(
  village.landed[0] > 0 && inlaneOf(village.landed[0]),
  `Village switchback returns to the right inlane (landed ${village.landed})`,
)
const abbey = flights.get('abbey-crossover')!
assert.ok(abbey.landed, 'the Abbey crossover returns its ball')
assert.ok(
  abbey.landed[0] < 0 && inlaneOf(abbey.landed[0]),
  `Abbey crossover returns to the left inlane (landed ${abbey.landed})`,
)
for (const shot of ['village-switchback', 'abbey-crossover']) {
  const flight = flights.get(shot)!
  const side = shot === 'village-switchback' ? 'right' : 'left'
  const flipper = table.flippers.find((f) => f.side === side)!
  const made = flight.events.findIndex(
    (e) => e.type === 'sensor-enter' && e.id.endsWith('-return'),
  )
  const touched = flight.events.findIndex(
    (e, i) => i > made && e.type === 'contact' && e.id === flipper.id,
  )
  const drained = flight.events.findIndex((e) => e.type === 'drain')
  assert.ok(
    touched > made && (drained < 0 || drained > touched),
    `${shot}'s return rolls onto the ${side} flipper before any drain`,
  )
}

// The lower field: the gap between the resting flipper tips is wider than
// the ball, so a dead ball rolls through rather than wedging between them.
{
  const [l, r] = table.flippers
  const tipX = (f: typeof l) =>
    f!.pivot[0] +
    (f!.side === 'left' ? 1 : -1) * f!.length * Math.cos(f!.restAngle)
  const gap = tipX(r) - tipX(l) - l!.tipRadius - r!.tipRadius
  assert.ok(
    gap > BALL * 2 * 1.2,
    `flipper tip gap ${gap.toFixed(4)} m clears the ball`,
  )
}

// A ball rolled down either inlane lands on its flipper, never in an outlane.
for (const side of ['left', 'right'] as const) {
  const s = side === 'left' ? -1 : 1
  const x = (INLANE_GUIDE[side] + s * SLING_BACK) / 2
  const physics = new PinballPhysics(RAPIER, table)
  try {
    physics.serveBall([x, BALL + 0.0005, -0.24], [0, 0, 0.3])
    const flipper = table.flippers.find((f) => f.side === side)!
    let touched = false
    for (let i = 0; i < PHYSICS_HZ * 3 && !touched; i++)
      for (const e of physics.step()) {
        assert.notEqual(e.type, 'drain', `${side} inlane must not drain`)
        if (e.type === 'contact' && e.id === flipper.id) touched = true
      }
    assert.ok(touched, `${side} inlane feeds the ${side} flipper`)
  } finally {
    physics.dispose()
  }
}

// The River Croc spits its ball onto the right inlane and so onto the right
// flipper: shooting the mouth must never cost the ball.
{
  const mouth = table.scoops.find((s) => s.id === 'croc-mouth')!
  assert.ok(inlaneOf(mouth.eject.at[0]), 'the Croc spits into the right inlane')
  const physics = new PinballPhysics(RAPIER, table)
  try {
    physics.serveBall(mouth.at, [0, 0, 0])
    let ejected = false
    let touched = false
    for (let i = 0; i < PHYSICS_HZ * 5 && !touched; i++)
      for (const e of physics.step()) {
        assert.notEqual(e.type, 'drain', 'the Croc never feeds a drain')
        if (e.type === 'eject' && e.id === mouth.id) ejected = true
        if (ejected && e.type === 'contact' && e.id === 'zuzu-lower-right')
          touched = true
      }
    assert.ok(touched, "the Croc's spit reaches the right flipper")
  } finally {
    physics.dispose()
  }
}

// Bot play on the full runtime: no ball is ever left sitting still outside a
// scoop. Catches pockets between ramp mouths, rails and drops that wedge a
// ball for good (a narrowing gap between the Bell and Abbey mouths did).
{
  const headless = () =>
    ({
      render() {},
      setSize() {},
      setPixelRatio() {},
      dispose() {},
    }) as unknown as RendererLike
  for (const skill of ['novice', 'average'] as const) {
    for (let seed = 1; seed <= 4; seed++) {
      const runtime = new PinballRuntime(
        {
          rng: mulberry32(seed),
          sound: { play: () => {} },
          demo: false,
          hiScore: 0,
        },
        RAPIER,
        table,
        headless,
        ZUZU_RULESET,
      )
      const inner = runtime as unknown as {
        physics: PinballPhysics
        rules: never
      }
      const bot = new PinballBot(
        BOT_SKILLS[skill],
        mulberry32(seed * 7919 + 1),
        null,
      )
      const still = new Map<number, { at: string; ticks: number }>()
      for (let tick = 0; tick < 60 * 120 && !runtime.over; tick++) {
        const balls = inner.physics.ballViews()
        runtime.update(
          bot.frame({
            balls,
            rules: inner.rules,
            ballOnPlunger: inner.physics.ballOnPlunger(),
            flippers: table.flippers,
          }),
        )
        for (const ball of inner.physics.ballViews()) {
          const at = ball.position.map((v) => v.toFixed(3)).join(',')
          const was = still.get(ball.id)
          const ticks = was?.at === at && !ball.captured ? was.ticks + 1 : 0
          still.set(ball.id, { at, ticks })
          assert.ok(
            ticks < 60 * 12,
            `${skill} seed ${seed}: ball stranded at ${at}`,
          )
        }
      }
      runtime.dispose()
    }
  }
}

assert.equal(livePhysicsWorlds(), 0, 'every measured world is freed')
console.log(
  'Zuzu shots made from real flips, ramp returns, inlanes, Croc spit and no stranded balls verified',
)
