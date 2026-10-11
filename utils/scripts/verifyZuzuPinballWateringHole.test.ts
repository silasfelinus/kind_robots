// The Watering Hole and the Death Roll (conductor zuzu-pinball/t-016): the
// River Croc's mini-mode inside the Homestead chapter. A swallow during
// Homestead opens it; an orbit lights the mouth; a swallow in that window is
// the Death Roll jackpot, which climbs while the window shrinks; an unlit
// swallow still pays the spit-back. Replayed through the pure reducer, then
// with the rules driving the real physics so every swallow is spat back, and
// the toy, waterline lamps, DMD close-up and sounds checked for their cues.
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { PINBALL_CUES } from '../arcade/pinball/audio/catalog'
import { PHYSICS_HZ } from '../arcade/pinball/clock'
import { Dmd } from '../arcade/pinball/dmd'
import { DmdQueue } from '../arcade/pinball/dmdQueue'
import { drawDmd } from '../arcade/pinball/dmdScenes'
import {
  livePhysicsWorlds,
  PinballPhysics,
} from '../arcade/pinball/physics/world'
import { CrocToy } from '../arcade/pinball/render/croc'
import type { RulesEvent } from '../arcade/pinball/rules/engine'
import { CHAPTERS } from '../arcade/pinball/tables/zuzuLastBell/chapters'
import {
  CROC_JAW,
  CROC_MOUTH,
  CROC_TOY,
} from '../arcade/pinball/tables/zuzuLastBell/croc'
import { WATERLINE_LAMPS } from '../arcade/pinball/tables/zuzuLastBell/lamps'
import {
  BALL_SAVE_STEPS,
  VALUES,
  ZUZU_RULESET as rules,
  type ZuzuRulesState,
} from '../arcade/pinball/tables/zuzuLastBell/rules'
import { ZUZU_LAST_BELL_GREYBOX as table } from '../arcade/pinball/tables/zuzuLastBell/table'
import {
  deathRollValue,
  deathRollWindow,
  WATERING_HOLE_CHAPTER,
  WATERING_HOLE_STEPS,
  WATERING_VALUES,
  wateringHoleRunning,
} from '../arcade/pinball/tables/zuzuLastBell/wateringHole'
import type { RuleEffect, SwitchEvent, Vec3 } from '../arcade/pinball/types'

await RAPIER.init()

const context = { shots: table.shots }
const lamps = (s: ZuzuRulesState) => rules.lamps(s, table).lamps
const sounds = (effects: RuleEffect[]) =>
  effects.flatMap((e) => (e.type === 'sound' ? [e.name] : []))
const scenes = (effects: RuleEffect[]) =>
  effects.flatMap((e) => (e.type === 'dmd' ? [e.scene ?? 'message'] : []))

assert.equal(CHAPTERS[0]!.id, WATERING_HOLE_CHAPTER, 'Homestead comes first')
for (const name of ['jaw-snap', 'water-spray'])
  assert.ok(name in PINBALL_CUES, `the ${name} cue`)
const inserts = new Set((table.inserts ?? []).map((i) => i.id))
for (const id of WATERLINE_LAMPS) assert.ok(inserts.has(id), id)

/** A switch event without its ball id (ball 1). */
type Loose<E> = E extends unknown ? Omit<E, 'ballId'> : never

/** The reducer driven by hand, with the Croc's mouth as switches. */
class Game {
  state: ZuzuRulesState
  at = 0
  constructor() {
    this.state = rules.initial(3, 7)
    this.send({ type: 'start' })
  }
  send(event: RulesEvent) {
    const r = rules.step(this.state, event, context)
    this.state = r.state
    return r.effects
  }
  sw(event: Loose<SwitchEvent>) {
    this.at += 1
    return this.send({
      type: 'switch',
      event: { ballId: 1, ...event } as SwitchEvent,
      tick: this.at,
    })
  }
  wait(steps: number) {
    const out: RuleEffect[] = []
    const end = this.at + steps
    while (this.at < end) {
      this.at = Math.min(end, this.at + PHYSICS_HZ / 60)
      out.push(...this.send({ type: 'tick', tick: this.at }))
    }
    return out
  }
  orbit(side: 'left' | 'right') {
    return [
      ...this.sw({ type: 'sensor-enter', id: `${side}-orbit-low` }),
      ...this.sw({ type: 'sensor-enter', id: `${side}-orbit-high` }),
    ]
  }
  /** A swallow and the spit, then wait for his jaws to open again. */
  swallow() {
    const out = this.sw({ type: 'capture', id: CROC_MOUTH })
    this.wait(PHYSICS_HZ / 2)
    out.push(...this.sw({ type: 'eject', id: CROC_MOUTH }))
    out.push(...this.wait(PHYSICS_HZ * 3.5))
    assert.equal(this.state.croc.cycle.phase, 'open')
    return out
  }
  get hole() {
    return this.state.wateringHole
  }
}

// Outside Homestead the Croc pays as always and no scene opens.
{
  const g = new Game()
  const before = g.state.score
  const out = g.swallow()
  assert.equal(wateringHoleRunning(g.hole), false)
  assert.equal(g.state.score - before, VALUES.crocSpit)
  assert.ok(
    sounds(out).includes('jaw-snap') && sounds(out).includes('water-spray'),
  )
  for (const id of WATERLINE_LAMPS)
    assert.equal(lamps(g.state)[id], 'on', 'the waterline glows while he waits')
}

// Homestead: a swallow opens the Watering Hole; an unlit swallow is the
// spit-back; an orbit lights the mouth; the Death Roll pays and climbs.
{
  const g = new Game()
  g.sw({ type: 'sensor-enter', id: 'shooter-exit' })
  g.sw({ type: 'capture', id: 'mortuary' })
  assert.equal(CHAPTERS[g.state.story.chapter]!.id, 'homestead')
  assert.ok(g.state.story.run, 'Homestead is being told')

  let out = g.swallow()
  assert.ok(wateringHoleRunning(g.hole), 'the coyote comes down to drink')
  assert.ok(scenes(out).includes('mode-intro'))
  assert.equal(rules.music(g.state), 'mode')
  for (const id of ['left-orbit', 'right-orbit'])
    assert.equal(lamps(g.state)[id], 'blink', `${id} stirs the water`)
  assert.equal(
    rules.animatronics!(g.state, g.at)[CROC_TOY]!.cue,
    'watering-hole',
  )

  // Unlit: the spit-back consolation, on top of his own swallow award.
  let before = g.state.score
  out = g.swallow()
  assert.equal(g.hole.rolls, 0)
  assert.equal(
    g.state.score - before,
    WATERING_VALUES.spitBack + VALUES.crocSpit,
    'an unlit swallow still pays',
  )
  assert.ok(
    out.some((e) => e.type === 'dmd' && e.text === 'SPIT BACK'),
    'the DMD says why it was only the spit-back',
  )

  // An orbit lights him; the lamps and the toy say so.
  g.orbit('left')
  assert.equal(g.hole.lit, true)
  assert.equal(g.hole.litUntil - g.at, deathRollWindow(0))
  assert.equal(lamps(g.state)['river-croc-mouth'], 'blink')
  for (const id of WATERLINE_LAMPS) assert.equal(lamps(g.state)[id], 'blink')
  assert.equal(rules.animatronics!(g.state, g.at)[CROC_TOY]!.cue, 'hungry')

  // The Death Roll.
  before = g.state.score
  out = g.swallow()
  assert.equal(g.hole.rolls, 1)
  assert.equal(
    g.state.score - before,
    deathRollValue(0, 1) + VALUES.crocSpit,
    'the Death Roll jackpot',
  )
  assert.ok(scenes(out).includes('death-roll'), 'the mouth close-up')
  assert.ok(sounds(out).includes('jackpot'))
  assert.equal(g.hole.lit, false, 'one Death Roll per orbit')

  // He is warier now: the next window is shorter and the jackpot bigger.
  assert.ok(deathRollWindow(1) < deathRollWindow(0))
  g.orbit('right')
  assert.equal(g.hole.litUntil - g.at, deathRollWindow(1))
  before = g.state.score
  g.swallow()
  assert.equal(g.state.score - before, deathRollValue(1, 1) + VALUES.crocSpit)
  assert.ok(deathRollValue(1, 1) > deathRollValue(0, 1))

  // A window let lapse goes dark: then it is the spit-back again.
  g.orbit('left')
  g.wait(deathRollWindow(2) + PHYSICS_HZ / 10)
  assert.equal(g.hole.lit, false, 'the lit mouth times out')
  assert.notEqual(lamps(g.state)['river-croc-mouth'], 'blink')
  g.swallow()
  assert.equal(g.hole.rolls, 2)

  // The timer closes the scene with its total.
  const total = g.hole.total
  assert.ok(total > deathRollValue(0, 1) + deathRollValue(1, 1))
  out = g.wait(WATERING_HOLE_STEPS)
  assert.equal(wateringHoleRunning(g.hole), false)
  assert.ok(
    out.some(
      (e) => e.type === 'dmd' && e.scene === 'mode-total' && e.value === total,
    ),
    'the Watering Hole total',
  )
}

// The ball draining closes the scene; a tilted machine opens nothing.
{
  const g = new Game()
  g.sw({ type: 'sensor-enter', id: 'shooter-exit' })
  g.sw({ type: 'capture', id: 'mortuary' })
  g.swallow()
  assert.ok(wateringHoleRunning(g.hole))
  g.wait(BALL_SAVE_STEPS + 1)
  g.sw({ type: 'drain' })
  assert.equal(wateringHoleRunning(g.hole), false, 'a drain ends it')

  const t = new Game()
  t.sw({ type: 'sensor-enter', id: 'shooter-exit' })
  t.sw({ type: 'capture', id: 'mortuary' })
  t.state = { ...t.state, tilted: true }
  t.swallow()
  assert.equal(wateringHoleRunning(t.hole), false, 'no scene on a tilt')
}

// Every legitimate swallow pays, whatever the order of orbits and swallows.
{
  const g = new Game()
  g.sw({ type: 'sensor-enter', id: 'shooter-exit' })
  g.sw({ type: 'capture', id: 'mortuary' })
  let seed = 11
  for (let i = 0; i < 40; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    if (seed % 3 === 0) g.orbit(seed % 2 ? 'left' : 'right')
    if (seed % 5 === 0) g.wait(PHYSICS_HZ * 2)
    const before = g.state.score
    g.swallow()
    assert.ok(g.state.score > before, `swallow ${i} paid`)
  }
}

// With the real physics: every Watering Hole swallow, lit or not, is spat
// back to the table; none feeds a drain and no ball is lost or made.
{
  const physics = new PinballPhysics(RAPIER, table)
  const mouth = table.scoops.find((s) => s.id === CROC_MOUTH)!
  const BALL = table.physical.ballRadiusM
  const toMouth = (): [Vec3, Vec3] => [
    [mouth.at[0] + 0.03, BALL + 0.0005, mouth.at[2] + 0.2],
    [-0.15, 0, -1.4],
  ]
  let state = rules.initial(100_000, 1)
  let step = 0
  let captures = 0
  let ejects = 0
  let drains = 0
  let heldDrains = 0
  let rolls = 0
  const send = (event: RulesEvent) => {
    const r = rules.step(state, event, context)
    state = r.state
    for (const e of r.effects)
      if (e.type === 'mechanism' && e.id === CROC_JAW)
        physics.setDoor(CROC_JAW, e.action === 'open')
  }
  const run = (steps: number) => {
    for (let i = 0; i < steps; i++) {
      step++
      for (const event of physics.step()) {
        if (event.type === 'drain') {
          drains++
          if (ejects < captures) heldDrains++
        }
        if (event.type === 'capture' && event.id === CROC_MOUTH) captures++
        if (event.type === 'eject' && event.id === CROC_MOUTH) ejects++
        send({ type: 'switch', event, tick: step })
      }
      if (step % 4 === 0) send({ type: 'tick', tick: step })
    }
  }
  try {
    send({ type: 'start' })
    // Homestead, held open for the whole run, with balls to spare.
    const long = { until: 1e9, shown: 0, rove: 0, movedAt: 0, total: 0 }
    state = { ...state, ballsInPlay: 99, story: { ...state.story, run: long } }
    for (let round = 0; round < 24; round++) {
      let left = PHYSICS_HZ * 8
      while (physics.ballCount > 0 && left-- > 0) run(1)
      assert.equal(physics.ballCount, 0, `round ${round}: last ball gone`)
      if (round > 0 && round % 2 === 0) {
        // An orbit, as switches: the next swallow is a Death Roll.
        for (const id of ['left-orbit-low', 'left-orbit-high'])
          send({
            type: 'switch',
            event: { type: 'sensor-enter', id, ballId: 99 },
            tick: step,
          })
      }
      // Keep the scene running for the whole soak.
      state = {
        ...state,
        wateringHole: wateringHoleRunning(state.wateringHole)
          ? { ...state.wateringHole, until: step + WATERING_HOLE_STEPS }
          : state.wateringHole,
      }
      const before = state.score
      const caught = captures
      physics.serveBall(...toMouth())
      let wait = 0
      while (captures === caught && wait++ < PHYSICS_HZ * 2) run(1)
      assert.equal(captures, caught + 1, `round ${round}: swallowed`)
      wait = 0
      while (state.croc.cycle.phase !== 'open' && wait++ < PHYSICS_HZ * 6)
        run(1)
      assert.equal(ejects, captures, `round ${round}: spat back`)
      assert.ok(state.score > before, `round ${round}: paid`)
      assert.ok(wateringHoleRunning(state.wateringHole))
      rolls = state.wateringHole.rolls
    }
    assert.ok(rolls >= 10, `Death Rolls through the physics (${rolls})`)
    assert.equal(heldDrains, 0, 'no ball drains from his jaws')
    assert.equal(physics.ballCount + drains, 24, 'no ball lost or made')
    console.log(
      `  24 Watering Hole swallows through the physics, ${rolls} Death Rolls, all spat back`,
    )
  } finally {
    physics.dispose()
  }
}

// The DMD close-up: jaws closing on the ball, then the award between teeth.
{
  const dmd = new Dmd()
  const q = new DmdQueue()
  q.push({ scene: 'death-roll', text: 'DEATH ROLL', value: 1_000_000 })
  const lit = () => dmd.buf.reduce((n, v) => n + (v >= 1 ? 1 : 0), 0)
  const idle = { score: 0, ball: 1, multiplier: 1 }
  q.tick(100)
  drawDmd(dmd, q.showing, idle, q.now)
  const opening = lit()
  q.tick(200)
  drawDmd(dmd, q.showing, idle, q.now)
  assert.ok(lit() > opening, 'the jaws close in')
  q.tick(500)
  drawDmd(dmd, q.showing, idle, q.now)
  assert.equal(q.showing?.request.scene, 'death-roll')
  assert.ok(lit() > 0, 'the award shows')
}

// The toy: the Death Roll rolls the head, except with reduced motion, which
// shows it as a steady, brighter glow; a lit mouth churns the waterline.
{
  const def = table.animatronics![0]!
  const moving = new CrocToy(def, (r) => r)
  const still = new CrocToy(def, (r) => r, { reducedMotion: true })
  for (const toy of [moving, still]) {
    toy.setPose({ phase: 'death-roll', age: 0.25 })
    for (let i = 0; i < 20; i++) toy.animate()
  }
  assert.ok(Math.abs(moving.rolled) > 0.5, 'the head rolls')
  assert.equal(still.rolled, 0, 'reduced motion: no roll')
  assert.ok(still.waterline >= moving.waterline, 'a steady, brighter cue')

  const calm = new CrocToy(def, (r) => r, { reducedMotion: true })
  const hungry = new CrocToy(def, (r) => r, { reducedMotion: true })
  calm.setPose({ phase: 'open', age: 1 })
  hungry.setPose({ phase: 'open', age: 1, cue: 'hungry' })
  for (let i = 0; i < 40; i++) {
    calm.animate()
    hungry.animate()
  }
  assert.ok(hungry.waterline > calm.waterline + 0.5, 'a lit mouth churns')
  // Reduced motion holds still: two frames apart, the same.
  const a = hungry.waterline
  hungry.animate()
  assert.ok(Math.abs(hungry.waterline - a) < 1e-3, 'no flicker')
}

assert.equal(livePhysicsWorlds(), 0)
console.log(
  'Watering Hole: Homestead opens it, orbits light the Death Roll, the spit-back consoles, the window shrinks, waterline, DMD close-up, sounds and reduced motion verified',
)
