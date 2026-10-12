// The Citadel lock and Harvest Moon (conductor zuzu-pinball/t-009, slice 1):
// the bell shot drops into the Citadel on its way back from the arch; the
// physics parks locked balls on the Citadel shelf and lets them go one by
// one; the rules keep a ball ledger, fall back to a virtual lock when the
// machine cannot hold a ball, and start the three-ball Harvest Moon on the
// third lock, with staggered ramp jackpots, an orbit-combo super jackpot and
// a ball save. Then rules and physics together, many lock-and-multiball
// cycles, with the ledger checked against the balls really on the table.
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { PHYSICS_HZ } from '../arcade/pinball/clock'
import {
  livePhysicsWorlds,
  PinballPhysics,
} from '../arcade/pinball/physics/world'
import type { RulesEvent } from '../arcade/pinball/rules/engine'
import {
  initialShotProgress,
  recognizeShots,
} from '../arcade/pinball/rules/shots'
import { CITADEL_LAMPS } from '../arcade/pinball/tables/zuzuLastBell/lamps'
import {
  BALLS_INSTALLED,
  CITADEL,
  LAST_BELL_SHOTS,
  lastBellJackpotValue,
  lastBellSuperValue,
  MULTIBALL_BALLS,
  STORM_RUNGS,
  stormJackpotValue,
  stormSuperValue,
  HARVEST_BALLS,
  jackpotValue,
  locksMade,
  superValue,
} from '../arcade/pinball/tables/zuzuLastBell/multiball'
import {
  VALUES,
  ZUZU_RULESET as rules,
  type ZuzuRulesState,
} from '../arcade/pinball/tables/zuzuLastBell/rules'
import {
  CITADEL_SLOTS,
  ZUZU_LAST_BELL_GREYBOX as table,
} from '../arcade/pinball/tables/zuzuLastBell/table'
import { AIM_HOLD_TICKS, cradle } from '../arcade/pinball/tuning/aim'
import type {
  RuleEffect,
  SwitchEvent,
  TableDef,
  Vec3,
} from '../arcade/pinball/types'

await RAPIER.init()

const context = { shots: table.shots }
const BALL = table.physical.ballRadiusM
const lamps = (s: ZuzuRulesState) => rules.lamps(s, table).lamps
const inserts = new Set((table.inserts ?? []).map((i) => i.id))
for (const id of CITADEL_LAMPS) assert.ok(inserts.has(id), id)
const citadelDef = table.scoops.find((s) => s.id === CITADEL)!
assert.equal(citadelDef.lock?.slots.length, 3, 'the Citadel holds three')

// The bell shot from the right flipper rings the bell on its way up and drops
// into the Citadel as it rolls back from the arch.
{
  const physics = new PinballPhysics(RAPIER, table)
  try {
    cradle(physics, 'right')
    physics.setFlipper('right', false)
    const delay = 30
    let progress = initialShotProgress()
    const shots: string[] = []
    let captured = -1
    let step = 0
    for (let t = 0; t < delay + 60 * 4 && captured < 0; t++) {
      if (t === delay) physics.setFlipper('right', true)
      if (t === delay + AIM_HOLD_TICKS) physics.setFlipper('right', false)
      for (let k = 0; k < PHYSICS_HZ / 60; k++) {
        step++
        for (const e of physics.step()) {
          const r = recognizeShots(table.shots, progress, e, step)
          progress = r.progress
          shots.push(...r.completed.map((c) => c.shotId))
          if (e.type === 'capture' && e.id === CITADEL) captured = step
        }
      }
    }
    assert.ok(shots.includes('bell-lane'), 'the bell rings')
    assert.ok(captured > 0, 'and the ball drops into the Citadel')
  } finally {
    physics.dispose()
  }
}

// The Citadel's kickout goes by subway to the left inlane and so onto the
// left flipper: never back up the bell lane, never straight to the drain.
{
  const physics = new PinballPhysics(RAPIER, table)
  try {
    const { at, velocity } = citadelDef.eject
    physics.serveBall(at, velocity)
    const flipper = table.flippers.find((f) => f.side === 'left')!
    let touched = false
    for (let i = 0; i < PHYSICS_HZ * 3 && !touched; i++)
      for (const e of physics.step()) {
        assert.notEqual(e.type, 'drain', 'the Citadel never feeds the drain')
        assert.ok(e.type !== 'capture', 'nor any scoop on the way')
        if (e.type === 'contact' && e.id === flipper.id) touched = true
      }
    assert.ok(touched, 'the Citadel kicks out to the left flipper')
  } finally {
    physics.dispose()
  }
}

/** A ball rolled down from the arch into the Citadel saucer. */
const toCitadel = (): [Vec3, Vec3] => [
  [citadelDef.at[0], BALL + 0.0005, -0.93],
  [0, 0, 0.3],
]

// The physics: a locked ball is parked in a slot and stays; a release lets
// the parked balls go one by one through the saucer's kicker.
{
  const physics = new PinballPhysics(RAPIER, table)
  try {
    const events: SwitchEvent[] = []
    const run = (steps: number) => {
      for (let i = 0; i < steps; i++) events.push(...physics.step())
    }
    for (let n = 0; n < 2; n++) {
      physics.serveBall(...toCitadel())
      const before = events.length
      while (!events.slice(before).some((e) => e.type === 'capture')) run(1)
      assert.equal(physics.lockHeld(CITADEL), 1, `ball ${n + 1} locks`)
    }
    run(PHYSICS_HZ * 2)
    assert.equal(
      events.filter((e) => e.type === 'eject' && e.id === CITADEL).length,
      0,
      'locked balls stay put',
    )
    assert.equal(physics.lockedBalls(CITADEL), 2)
    const parked = physics.ballViews()
    for (const [i, slot] of CITADEL_SLOTS.slice(0, 2).entries()) {
      const ball = parked[i]!
      assert.ok(ball.captured, 'parked out of play')
      assert.ok(
        Math.hypot(ball.position[0] - slot[0], ball.position[2] - slot[2]) <
          1e-6,
        `on the shelf, slot ${i + 1}`,
      )
    }
    assert.equal(physics.releaseLocked(CITADEL), 2)
    const at = events.length
    run(PHYSICS_HZ * 3)
    const ejects = events
      .slice(at)
      .filter((e) => e.type === 'eject' && e.id === CITADEL)
    assert.equal(ejects.length, 2, 'both come back out, one at a time')
    assert.equal(physics.lockedBalls(CITADEL), 0)
    assert.equal(physics.lockHeld('croc-mouth'), 0, 'only a lock scoop locks')
  } finally {
    physics.dispose()
  }
}

/** The reducer by hand. */
class Game {
  state: ZuzuRulesState
  at = 0
  ball = 1
  constructor(state?: ZuzuRulesState) {
    this.state = state ?? rules.initial(3, 7)
    if (!state) this.send({ type: 'start' })
  }
  send(event: RulesEvent) {
    const r = rules.step(this.state, event, context)
    this.state = r.state
    return r.effects
  }
  sw(event: Record<string, unknown>) {
    this.at += 1
    return this.send({
      type: 'switch',
      event: { ballId: this.ball, ...event } as SwitchEvent,
      tick: this.at,
    })
  }
  wait(steps: number) {
    const end = this.at + steps
    const out: RuleEffect[] = []
    while (this.at < end) {
      this.at = Math.min(end, this.at + PHYSICS_HZ / 60)
      out.push(...this.send({ type: 'tick', tick: this.at }))
    }
    return out
  }
  shot(id: string) {
    const def = table.shots.find((s) => s.id === id)!
    const out: RuleEffect[] = []
    for (const sensor of def.sensors)
      out.push(...this.sw({ type: 'sensor-enter', id: sensor }))
    return out
  }
  /** A ball into the Citadel; a fresh ball id each time. */
  citadel() {
    this.ball += 1
    return this.sw({ type: 'capture', id: CITADEL })
  }
}
const has = (effects: RuleEffect[], match: Partial<RuleEffect>) =>
  effects.some((e) =>
    Object.entries(match).every(
      ([k, v]) => (e as Record<string, unknown>)[k] === v,
    ),
  )

// Lock, relight, lock, and the third lock starts Harvest Moon.
{
  const g = new Game()
  assert.equal(g.state.citadel.lit, true, 'the first lock is lit')
  assert.equal(lamps(g.state)['citadel-1'], 'blink')
  let out = g.citadel()
  assert.ok(has(out, { type: 'mechanism', id: CITADEL, action: 'lock' }))
  assert.ok(has(out, { type: 'serve-ball' }), 'a new ball to plunge')
  assert.deepEqual(g.state.citadel.locked, [g.ball])
  assert.equal(g.state.ballsInPlay, 1)
  assert.equal(lamps(g.state)['citadel-1'], 'on')
  assert.equal(lamps(g.state)['citadel-2'], 'off', 'not lit until relit')

  // Unlit: a small award, and the saucer kicks the ball out.
  let before = g.state.score
  out = g.citadel()
  assert.equal(g.state.score - before, VALUES.citadel)
  assert.ok(!has(out, { type: 'mechanism', action: 'lock' }))

  // The Village ramp lights the next lock.
  g.shot('village-switchback')
  assert.equal(g.state.citadel.lit, true)
  assert.equal(lamps(g.state)['citadel-2'], 'blink')
  g.citadel()
  assert.equal(locksMade(g.state.citadel), 2)

  // Locks are kept across a drain.
  g.wait(PHYSICS_HZ * 9)
  g.sw({ type: 'drain' })
  assert.equal(g.state.ball, 2)
  assert.equal(g.state.citadel.locked.length, 2, 'locks carry to the next ball')

  g.shot('village-switchback')
  out = g.citadel()
  assert.equal(g.state.multiball.kind, 'harvest', 'Harvest Moon')
  assert.ok(has(out, { type: 'mechanism', id: CITADEL, action: 'release' }))
  assert.ok(!has(out, { type: 'add-ball' }), 'all three are real balls')
  assert.equal(g.state.ballsInPlay, HARVEST_BALLS)
  assert.equal(locksMade(g.state.citadel), 0)
  assert.equal(rules.music(g.state), 'multiball')

  // Staggered jackpots: Village, then Abbey, each worth more.
  assert.equal(lamps(g.state)['village-switchback-arrow'], 'blink')
  before = g.state.score
  out = g.shot('village-switchback')
  assert.ok(g.state.score - before >= jackpotValue(0, 1))
  assert.ok(has(out, { scene: 'jackpot' } as Partial<RuleEffect>))
  g.shot('village-switchback')
  assert.equal(g.state.multiball.jackpots, 1, 'the same ramp twice is not')
  g.shot('abbey-crossover')
  assert.equal(g.state.multiball.jackpots, 2)
  assert.equal(g.state.multiball.superLit, true)
  assert.equal(lamps(g.state)['left-orbit'], 'blink', 'the orbits for super')

  // An orbit on its own is not a combo; an orbit right after a ramp is.
  g.wait(PHYSICS_HZ * 4)
  g.shot('left-orbit')
  assert.equal(g.state.multiball.supers, 0, 'no combo, no super')
  g.wait(PHYSICS_HZ * 4)
  g.shot('village-switchback')
  before = g.state.score
  out = g.shot('right-orbit')
  assert.equal(g.state.multiball.supers, 1, 'the super jackpot')
  assert.ok(g.state.score - before >= superValue(0, 1))
  assert.ok(has(out, { scene: 'super-jackpot' } as Partial<RuleEffect>))
  assert.equal(g.state.multiball.superLit, false, 'the ladder starts again')

  // Drains: given back during the save, then down to one ball ends it.
  const total = g.state.multiball.total
  const fresh = new Game({
    ...g.state,
    multiball: { ...g.state.multiball, saveUntil: g.at + 100 },
  })
  fresh.at = g.at
  out = fresh.sw({ type: 'drain' })
  assert.ok(has(out, { type: 'add-ball', count: 1 } as Partial<RuleEffect>))
  assert.equal(fresh.state.ballsInPlay, HARVEST_BALLS, 'saved')
  fresh.wait(200)
  fresh.sw({ type: 'drain' })
  assert.equal(fresh.state.ballsInPlay, 2)
  assert.equal(fresh.state.multiball.kind, 'harvest')
  out = fresh.sw({ type: 'drain' })
  assert.equal(fresh.state.ballsInPlay, 1)
  assert.equal(fresh.state.multiball.kind, null, 'Harvest Moon is over')
  assert.ok(
    has(out, { scene: 'mode-total', value: total } as Partial<RuleEffect>),
  )
  assert.equal(fresh.state.ball, 2, 'still the same ball')
  assert.ok(fresh.state.thisBall.jackpots >= 3, 'jackpots for the bonus')
}

// The virtual fallback: a full trough cannot spare a ball, so the lock is
// counted, not held; and a physical lock the machine could not hold heals
// itself when its ball comes back out of the saucer.
{
  const g = new Game()
  g.state = { ...g.state, ballsInPlay: BALLS_INSTALLED }
  const out = g.citadel()
  assert.ok(!has(out, { type: 'mechanism', action: 'lock' }), 'no spare ball')
  assert.ok(!has(out, { type: 'serve-ball' }))
  assert.equal(g.state.citadel.virtual, 1)

  const h = new Game()
  h.citadel()
  const id = h.ball
  assert.deepEqual(h.state.citadel.locked, [id])
  h.sw({ type: 'eject', id: CITADEL, ballId: id })
  assert.deepEqual(h.state.citadel.locked, [])
  assert.equal(h.state.citadel.virtual, 1, 'the lock still counts')
  assert.equal(h.state.ballsInPlay, 2, 'and the ball is back in play')
}

// No lock on a tilt, and none during a multiball.
{
  const g = new Game()
  g.state = { ...g.state, tilted: true }
  g.citadel()
  assert.equal(locksMade(g.state.citadel), 0)
}

// Game over lets the locked balls go.
{
  const g = new Game(rules.initial(1, 3))
  g.send({ type: 'start' })
  g.citadel()
  g.wait(PHYSICS_HZ * 9)
  const out = g.sw({ type: 'drain' })
  assert.ok(g.state.over)
  assert.ok(has(out, { type: 'mechanism', id: CITADEL, action: 'release' }))
}

// Storm Crow: the broken seals ready it, both orbits start it; every lane
// climbs its own ladder, and once each has paid the bell lane is the super.
{
  const g = new Game()
  for (let i = 1; i <= 4; i++)
    g.sw({ type: 'drop', id: `abbey-seal-${i}`, bank: 'abbey-seals' })
  assert.equal(g.state.storm.ready, true, 'Storm Crow is ready')
  assert.equal(lamps(g.state)['left-orbit'], 'blink')
  g.shot('left-orbit')
  assert.equal(g.state.multiball.kind, null, 'one orbit is not enough')
  assert.notEqual(lamps(g.state)['left-orbit'], 'blink', 'made: dark')
  let out = g.shot('right-orbit')
  assert.equal(g.state.multiball.kind, 'storm')
  assert.ok(has(out, { type: 'add-ball', count: 3 } as Partial<RuleEffect>))
  assert.equal(g.state.ballsInPlay, MULTIBALL_BALLS.storm)
  assert.equal(g.state.storm.ready, false)

  // The left orbit's ladder: three rungs, each worth more, then spent.
  const paid: number[] = []
  for (let rung = 0; rung < STORM_RUNGS + 1; rung++) {
    g.wait(PHYSICS_HZ * 4)
    const before = g.state.score
    g.shot('left-orbit')
    paid.push(g.state.score - before)
  }
  assert.equal(g.state.multiball.ladder['left-orbit'], STORM_RUNGS)
  for (let rung = 0; rung < STORM_RUNGS; rung++)
    assert.ok(paid[rung]! >= stormJackpotValue(rung, 1), `rung ${rung + 1}`)
  assert.ok(paid[STORM_RUNGS]! < stormJackpotValue(0, 1), 'the ladder is spent')
  assert.notEqual(lamps(g.state)['left-orbit'], 'blink')
  assert.equal(g.state.multiball.superLit, false)
  for (const lane of ['right-orbit', 'village-switchback', 'abbey-crossover'])
    g.shot(lane)
  assert.equal(g.state.multiball.superLit, false, 'one lane still to pay')
  g.shot('bell-spiral')
  assert.equal(g.state.multiball.superLit, true, 'every lane has paid')
  assert.equal(lamps(g.state)['bell-flasher'], 'blink', 'the bell lane is lit')
  const before = g.state.score
  out = g.shot('bell-lane')
  assert.ok(g.state.score - before >= stormSuperValue(0, 1))
  assert.ok(has(out, { scene: 'super-jackpot' } as Partial<RuleEffect>))
  assert.deepEqual(g.state.multiball.ladder, {}, 'the ladders start again')
  assert.ok(stormSuperValue(1, 1) > stormSuperValue(0, 1), 'and climb')
}

// The Last Bell: the fifth seal starts the six-ball wizard multiball, the
// locked balls released among them; every major shot is a jackpot and six
// light the Bell spiral for the super.
{
  const g = new Game()
  g.citadel()
  g.shot('village-switchback')
  g.citadel()
  assert.equal(g.state.citadel.locked.length, 2)
  g.state = {
    ...g.state,
    story: {
      ...g.state.story,
      chapter: 4,
      progress: { hits: 2, made: [] },
      run: { until: g.at + 1e6, shown: 0, rove: 0, movedAt: g.at, total: 0 },
    },
  }
  let out = g.shot('bell-spiral')
  assert.equal(g.state.multiball.kind, 'last-bell', 'The Last Bell')
  assert.ok(has(out, { type: 'mechanism', id: CITADEL, action: 'release' }))
  assert.ok(has(out, { type: 'add-ball', count: 3 } as Partial<RuleEffect>))
  assert.ok(has(out, { scene: 'wizard' } as Partial<RuleEffect>))
  assert.equal(g.state.ballsInPlay, BALLS_INSTALLED, 'all six balls')
  assert.equal(g.state.citadel.locked.length, 0)
  assert.equal(g.state.story.round, 2, 'and the story begins again')
  for (const [i, shot] of LAST_BELL_SHOTS.entries()) {
    const before = g.state.score
    g.shot(shot)
    assert.ok(
      g.state.score - before >= lastBellJackpotValue(i, 2),
      `${shot} is a jackpot`,
    )
  }
  assert.equal(g.state.multiball.superLit, true, 'six jackpots')
  const before = g.state.score
  out = g.shot('bell-spiral')
  assert.ok(g.state.score - before >= lastBellSuperValue(0, 2))
  assert.ok(has(out, { scene: 'super-jackpot' } as Partial<RuleEffect>))
}

/**
 * Rules and physics together: a served ball goes straight up to the arch
 * and down into the Citadel, the trough serves multiball balls to the
 * middle of the field. Many lock-and-Harvest-Moon cycles; at every settled
 * moment the balls on the table are what the ledger says.
 */
type SoakMode = 'harvest' | 'storm' | 'last-bell'

function soak(def: TableDef, cycles: number, mode: SoakMode = 'harvest') {
  const physics = new PinballPhysics(RAPIER, def)
  let state = rules.initial(100_000, 5)
  let step = 0
  let pendingAdds = 0
  const counts = {
    harvests: 0,
    starts: 0,
    physical: 0,
    virtual: 0,
    maxBalls: 0,
  }
  const send = (event: RulesEvent) => {
    const before = state
    const r = rules.step(state, event, { shots: def.shots })
    state = r.state
    if (state.citadel.virtual > before.citadel.virtual) counts.virtual++
    if (state.citadel.locked.length > before.citadel.locked.length)
      counts.physical++
    if (state.multiball.kind && !before.multiball.kind) {
      if (state.multiball.kind === 'harvest') counts.harvests++
      if (state.multiball.kind === mode) counts.starts++
    }
    for (const e of r.effects) {
      if (e.type === 'serve-ball') physics.serveBall(...toCitadel())
      if (e.type === 'add-ball') pendingAdds += e.count
      if (e.type === 'mechanism' && e.action === 'lock') physics.lockHeld(e.id)
      if (e.type === 'mechanism' && e.action === 'release')
        physics.releaseLocked(e.id)
    }
  }
  // Balls the trough still owes count as in play.
  const ledger = () =>
    physics.ballCount + pendingAdds ===
    state.ballsInPlay + state.citadel.locked.length
  // A lazy player: nobody aims, but balls left resting on the flippers
  // (three can wedge between the tips) get a flip after a second.
  let still = 0
  let flipping = 0
  const run = (steps: number) => {
    for (let i = 0; i < steps; i++) {
      step++
      const resting = physics
        .ballViews()
        .every((b) => b.captured || b.speed < 0.02)
      still = resting && physics.ballCount > 0 ? still + 1 : 0
      if (still > PHYSICS_HZ) {
        flipping = PHYSICS_HZ / 8
        // ...and the machine's ball search shakes the table, as the
        // runtime does for a ball sat still where no flipper reaches.
        physics.nudge(step % 2 ? 0.1 : -0.1, -0.25)
        still = 0
      }
      physics.setFlipper('left', flipping > 0)
      physics.setFlipper('right', flipping > 0)
      if (flipping > 0) flipping--
      if (pendingAdds > 0 && step % 60 === 0) {
        physics.serveBall([0, BALL + 0.0005, -0.5], [0.1, 0, 0.2])
        pendingAdds--
      }
      for (const event of physics.step())
        send({ type: 'switch', event, tick: step })
      if (step % 4 === 0) send({ type: 'tick', tick: step })
      counts.maxBalls = Math.max(counts.maxBalls, physics.ballCount)
      assert.ok(ledger(), `step ${step}: the ledger matches the table`)
    }
  }
  /** A shot's switches, as a ball off the table makes them. */
  const shot = (id: string) => {
    for (const sensor of def.shots.find((x) => x.id === id)!.sensors)
      send({
        type: 'switch',
        event: { type: 'sensor-enter', id: sensor, ballId: 999 },
        tick: step,
      })
  }
  try {
    send({ type: 'start' })
    for (let cycle = 0; cycle < cycles; cycle++) {
      let guard = 0
      if (mode === 'storm') {
        // The seals are broken; both orbits start the storm.
        state = {
          ...state,
          citadel: { ...state.citadel, lit: false },
          storm: { ready: true, orbits: [] },
        }
        shot('left-orbit')
        shot('right-orbit')
      }
      // The Last Bell: two balls locked on the shelf first, so the wizard
      // has to release them; then the fifth seal's last shot.
      while (
        mode === 'last-bell' &&
        state.citadel.locked.length < 2 &&
        guard++ < 10
      ) {
        if (!state.citadel.lit)
          state = { ...state, citadel: { ...state.citadel, lit: true } }
        const locked = state.citadel.locked.length
        let wait = 0
        while (
          state.citadel.locked.length === locked &&
          wait++ < PHYSICS_HZ * 4
        )
          run(1)
      }
      if (mode === 'last-bell') {
        assert.equal(state.citadel.locked.length, 2, 'two balls locked')
        state = {
          ...state,
          citadel: { ...state.citadel, lit: false },
          story: {
            ...state.story,
            chapter: 4,
            progress: { hits: 2, made: [] },
            run: {
              until: step + 1e6,
              shown: 0,
              rove: 0,
              movedAt: step,
              total: 0,
            },
          },
        }
        shot('bell-spiral')
      }
      // Lock until Harvest Moon, relighting the Citadel each time.
      while (!state.multiball.kind && guard++ < 10) {
        if (!state.citadel.lit)
          state = { ...state, citadel: { ...state.citadel, lit: true } }
        const caught = counts.physical + counts.virtual + counts.harvests
        let wait = 0
        while (
          counts.physical + counts.virtual + counts.harvests === caught &&
          wait++ < PHYSICS_HZ * 4
        )
          run(1)
        run(PHYSICS_HZ)
      }
      assert.equal(state.multiball.kind, mode, `cycle ${cycle}: it starts`)
      run(PHYSICS_HZ * 3)
      assert.equal(physics.lockedBalls(CITADEL), 0, 'all released')
      // Let them all drain (nobody flips) until the multiball ends.
      let wait = 0
      while (state.multiball.kind && wait++ < PHYSICS_HZ * 60) run(1)
      assert.equal(state.multiball.kind, null, `cycle ${cycle}: it ends`)
      run(PHYSICS_HZ * 2)
    }
    return counts
  } finally {
    physics.dispose()
  }
}

const CYCLES = Number(process.env.MULTIBALL_CYCLES ?? 12)
const real = soak(table, CYCLES)
assert.equal(real.harvests, CYCLES)
assert.ok(real.physical >= CYCLES * 2, `physical locks (${real.physical})`)
assert.equal(real.maxBalls <= BALLS_INSTALLED, true, 'never more than six')

// A machine whose Citadel cannot hold a ball (no lock slots): every lock
// falls back to virtual and heals itself, and the multiball still starts.
const noLock: TableDef = {
  ...table,
  scoops: table.scoops.map((s) =>
    s.id === CITADEL ? { ...s, lock: undefined } : s,
  ),
}
const virtual = soak(noLock, Math.max(2, CYCLES / 4))
assert.ok(virtual.harvests >= 2)
assert.equal(virtual.physical, virtual.virtual, 'every lock healed to virtual')

// Storm Crow (four balls) and The Last Bell (six, the two locked balls
// released among them) through the physics, the ledger checked every step.
const storm = soak(table, Math.max(2, CYCLES / 3), 'storm')
assert.equal(storm.starts, Math.max(2, CYCLES / 3))
assert.ok(
  storm.maxBalls >= 4 && storm.maxBalls <= BALLS_INSTALLED,
  'four in play',
)
const wizard = soak(table, Math.max(2, CYCLES / 3), 'last-bell')
assert.equal(wizard.starts, Math.max(2, CYCLES / 3))
assert.equal(wizard.maxBalls, BALLS_INSTALLED, 'all six balls')

assert.equal(livePhysicsWorlds(), 0)
console.log(
  `  ${storm.starts} Storm Crows (4 balls) and ${wizard.starts} Last Bells (6 balls) through the physics`,
)
console.log(
  `  ${CYCLES} Harvest Moons through the physics (${real.physical} physical locks), ${virtual.harvests} more on a lockless Citadel`,
)
console.log(
  'Citadel lock, Harvest Moon, Storm Crow and The Last Bell: bell shot to the Citadel, physical lock and release, ledger, virtual fallback, staggered jackpots, orbit-combo super, ball save and soak verified',
)
