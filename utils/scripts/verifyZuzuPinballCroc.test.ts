// The River Croc (conductor zuzu-pinball/t-015): his cycle in the rules, the
// jaw gate in the physics, the sculpted toy in the renderer, and many
// capture-and-spit rounds with the rules driving the real Rapier physics.
// One ball at a time, always given back, never a drain, never a lost ball.
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { PHYSICS_HZ } from '../arcade/pinball/clock'
import {
  livePhysicsWorlds,
  PinballPhysics,
} from '../arcade/pinball/physics/world'
import { CrocToy } from '../arcade/pinball/render/croc'
import type { RulesEvent } from '../arcade/pinball/rules/engine'
import {
  CROC_JAW,
  CROC_MOUTH,
  CROC_STEPS,
  CROC_TOY,
} from '../arcade/pinball/tables/zuzuLastBell/croc'
import {
  ZUZU_RULESET as rules,
  type ZuzuRulesState,
} from '../arcade/pinball/tables/zuzuLastBell/rules'
import { ZUZU_LAST_BELL_GREYBOX as table } from '../arcade/pinball/tables/zuzuLastBell/table'
import type { RuleEffect, Vec3 } from '../arcade/pinball/types'

await RAPIER.init()

const context = { shots: table.shots }
const mouth = table.scoops.find((s) => s.id === CROC_MOUTH)!
const BALL = table.physical.ballRadiusM
const ROUNDS = Number(process.env.CROC_ROUNDS ?? 200)

// The table carries the jaw gate (open at rest) and the toy.
const jaw = table.doors?.find((d) => d.id === CROC_JAW)
assert.ok(jaw?.startsOpen, 'the jaws wait open for the ball')
assert.ok(jaw.closed.length > 0 && jaw.closed.every((w) => w.hidden))
assert.ok(table.animatronics?.some((a) => a.id === CROC_TOY))

/** Rules and physics together: switches in, mechanisms out. */
class Croc {
  physics = new PinballPhysics(RAPIER, table)
  state: ZuzuRulesState
  effects: RuleEffect[] = []
  step = 0
  drains = 0
  /** Drains while a ball was in his jaws: must stay 0. */
  drainsWhileHeld = 0
  captures = 0
  ejects = 0
  constructor() {
    // Enough balls that the rounds never reach game over.
    this.state = rules.initial(100_000, 1)
    this.send({ type: 'start' })
  }
  send(event: RulesEvent) {
    const r = rules.step(this.state, event, context)
    this.state = r.state
    for (const e of r.effects) {
      this.effects.push(e)
      if (e.type === 'mechanism' && e.id === CROC_JAW)
        this.physics.setDoor(CROC_JAW, e.action === 'open')
    }
  }
  run(steps: number) {
    for (let i = 0; i < steps; i++) {
      this.step++
      for (const event of this.physics.step()) {
        if (event.type === 'drain') {
          this.drains++
          if (this.ejects < this.captures) this.drainsWhileHeld++
        }
        if (event.type === 'capture' && event.id === CROC_MOUTH) this.captures++
        if (event.type === 'eject' && event.id === CROC_MOUTH) this.ejects++
        this.send({ type: 'switch', event, tick: this.step })
      }
      if (this.step % 4 === 0) this.send({ type: 'tick', tick: this.step })
    }
  }
  get phase() {
    return this.state.croc.cycle.phase
  }
  dispose() {
    this.physics.dispose()
  }
}

/** A ball rolled up the left bank into the mouth, as a flipper shot sends it. */
const toMouth = (): [Vec3, Vec3] => [
  [mouth.at[0] + 0.03, BALL + 0.0005, mouth.at[2] + 0.2],
  [-0.15, 0, -1.4],
]

// The full cycle, timed: open, captured, death roll, spit, submerged, rising,
// open again; the jaw gate shuts on the capture and opens as he rises.
{
  const c = new Croc()
  try {
    assert.equal(c.phase, 'open')
    assert.equal(c.physics.doorStates()[CROC_JAW], true)
    c.physics.serveBall(...toMouth())
    const seen: string[] = [c.phase]
    for (let i = 0; i < PHYSICS_HZ * 6; i++) {
      c.run(1)
      if (seen.at(-1) !== c.phase) seen.push(c.phase)
      if (seen.length > 1 && c.phase === 'open') break
    }
    assert.deepEqual(seen, [
      'open',
      'captured',
      'death-roll',
      'spit',
      'submerged',
      'rising',
      'open',
    ])
    assert.equal(c.captures, 1)
    assert.equal(c.ejects, 1)
    assert.equal(c.drainsWhileHeld, 0, 'the Croc never feeds a drain')
    assert.equal(c.physics.ballCount + c.drains, 1, 'the ball is conserved')
    assert.equal(c.physics.doorStates()[CROC_JAW], true, 'jaws open again')
    const pose = rules.animatronics!(c.state, c.step)[CROC_TOY]
    assert.equal(pose?.phase, 'open')
  } finally {
    c.dispose()
  }
}

// Mid-chapter, too: the jaws open again while a chapter's timer is running
// (a quiet tick, one that changes no countdown, still carries the jaw).
{
  const c = new Croc()
  try {
    const run = { until: 1e9, shown: 0, rove: 0, movedAt: 0, total: 0 }
    // Balls to spare, so a later drain never ends the chapter early.
    c.state = { ...c.state, ballsInPlay: 9, story: { ...c.state.story, run } }
    c.physics.serveBall(...toMouth())
    let reopened = false
    for (let i = 0; i < PHYSICS_HZ * 6 && !reopened; i++) {
      c.run(1)
      reopened = c.captures === 1 && c.phase === 'open'
    }
    assert.ok(reopened, 'the cycle comes round during a chapter')
    assert.ok(c.state.story.run, 'the chapter is still being told')
    assert.equal(
      c.physics.doorStates()[CROC_JAW],
      true,
      'his jaws open again mid-chapter',
    )
  } finally {
    c.dispose()
  }
}

// While his jaws are shut, the teeth turn a ball away: no second capture.
{
  const c = new Croc()
  try {
    c.physics.setDoor(CROC_JAW, false)
    c.physics.serveBall(...toMouth())
    c.run(PHYSICS_HZ * 2)
    assert.equal(c.captures, 0, 'a shut mouth takes nothing')
    assert.equal(c.physics.ballCount, 1)
  } finally {
    c.dispose()
  }
}

// Two balls at once (multiball): one is swallowed, the other bounces off the
// shut jaws, and both are still in play afterwards.
{
  const c = new Croc()
  try {
    c.physics.serveBall(...toMouth())
    c.run(PHYSICS_HZ / 4)
    assert.equal(c.phase === 'captured' || c.phase === 'death-roll', true)
    c.physics.serveBall(...toMouth())
    c.run(PHYSICS_HZ / 2)
    assert.equal(c.captures, 1, 'the busy mouth refuses the second ball')
    c.run(PHYSICS_HZ)
    assert.equal(c.ejects, 1)
    assert.equal(c.physics.ballCount + c.drains, 2, 'no ball lost or made')
  } finally {
    c.dispose()
  }
}

// A tilt while he holds the ball: the flippers die, but he still spits it
// back to the table, and the ball is neither lost in his jaws nor doubled.
{
  const c = new Croc()
  try {
    c.physics.serveBall(...toMouth())
    let wait = 0
    while (c.captures === 0 && wait++ < PHYSICS_HZ * 2) c.run(1)
    assert.equal(c.captures, 1)
    c.state = { ...c.state, tilted: true }
    wait = 0
    while (c.ejects === 0 && wait++ < PHYSICS_HZ * 3) c.run(1)
    assert.equal(c.ejects, 1, 'spat back through a tilt')
    assert.equal(c.drainsWhileHeld, 0)
    assert.equal(c.physics.ballCount + c.drains, 1, 'one ball, still')
  } finally {
    c.dispose()
  }
}

// The lamp cue: the Croc's arrow is dark whenever the jaws are shut.
{
  const c = new Croc()
  try {
    const lit = () => rules.lamps(c.state, table).lamps['river-croc-mouth']
    assert.notEqual(lit(), 'off')
    c.physics.serveBall(...toMouth())
    c.run(PHYSICS_HZ / 3)
    assert.equal(lit(), 'off')
  } finally {
    c.dispose()
  }
}

// Many rounds, deterministic: every swallow is spat back onto the right
// inlane, the ball is conserved, and the cycle always comes back to open.
{
  const c = new Croc()
  try {
    let rounds = 0
    let worst = 0
    while (rounds < ROUNDS) {
      let wait = 0
      while (c.physics.ballCount > 0 && wait < PHYSICS_HZ * 4) {
        c.run(1)
        wait++
      }
      assert.equal(c.physics.ballCount, 0, `round ${rounds}: last ball gone`)
      const before = c.captures
      c.physics.serveBall(...toMouth())
      let steps = 0
      while (c.captures === before && steps < PHYSICS_HZ * 2) {
        c.run(1)
        steps++
      }
      assert.equal(c.captures, before + 1, `round ${rounds}: swallowed`)
      steps = 0
      while (c.phase !== 'open' && steps < PHYSICS_HZ * 6) {
        c.run(1)
        steps++
      }
      worst = Math.max(worst, steps)
      assert.equal(c.phase, 'open', `round ${rounds}: back to open`)
      assert.equal(c.ejects, c.captures, `round ${rounds}: spat back`)
      rounds++
    }
    const cycle =
      CROC_STEPS.captured +
      CROC_STEPS.spit +
      CROC_STEPS.submerged +
      CROC_STEPS.rising
    assert.ok(worst < cycle + mouth.holdMs * (PHYSICS_HZ / 1000) + PHYSICS_HZ)
    assert.equal(c.ejects, ROUNDS)
    assert.equal(c.drainsWhileHeld, 0, 'no ball ever drains from his jaws')
    console.log(
      `  ${ROUNDS} capture-and-spit rounds, ${c.drains} later drains, none during a hold`,
    )
  } finally {
    c.dispose()
  }
}

// The toy follows the pose: wide jaws when open, shut when he has the ball.
{
  const toy = new CrocToy(table.animatronics![0]!, (r) => r)
  toy.setPose({ phase: 'open', age: 0 })
  for (let i = 0; i < 40; i++) toy.animate()
  assert.ok(toy.gape > 0.5, `open jaws gape (${toy.gape.toFixed(2)})`)
  toy.setPose({ phase: 'captured', age: 0 })
  for (let i = 0; i < 10; i++) toy.animate()
  assert.ok(toy.gape < 0.05, 'jaws snap shut on the ball')
  toy.setPose({ phase: 'death-roll', age: 0.3 })
  toy.animate()
  toy.setPose({ phase: 'submerged', age: 1 })
  for (let i = 0; i < 40; i++) toy.animate()
  assert.ok(toy.gape < 0.05)
}

assert.equal(livePhysicsWorlds(), 0)
console.log(
  'River Croc: cycle, jaw gate, one ball at a time, spit to the inlane, toy poses and capture rounds verified',
)
