// The hidden undercrypt (conductor zuzu-pinball/t-010): a mini-table behind
// the backbox with its own flippers, three skull standups and a HOME saucer.
// Relic strikes light it, the Mortuary sends the ball down a subway to it,
// and HOME or its drain sends the ball back up to the Mortuary's kicker. The
// physics proves the trip there and back, every target from a crypt flipper
// and that nothing is stranded or lost below; the rules prove when it opens
// (never in a multiball or a chapter), what it pays and how it ends.
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { PHYSICS_HZ } from '../arcade/pinball/clock'
import {
  livePhysicsWorlds,
  PinballPhysics,
} from '../arcade/pinball/physics/world'
import type { RulesEvent } from '../arcade/pinball/rules/engine'
import { cameraViewFor } from '../arcade/pinball/runtime'
import { RELICS_FOR_CRYPT } from '../arcade/pinball/tables/zuzuLastBell/chapters'
import {
  CRYPT_DRAIN,
  CRYPT_ENTRY,
  CRYPT_HOME,
  RELIC,
  VALUES,
  ZUZU_RULESET as rules,
  type ZuzuRulesState,
} from '../arcade/pinball/tables/zuzuLastBell/rules'
import {
  CRYPT,
  CRYPT_SKULLS,
  ZUZU_LAST_BELL_GREYBOX as table,
} from '../arcade/pinball/tables/zuzuLastBell/table'
import type { RuleEffect, SwitchEvent } from '../arcade/pinball/types'

await RAPIER.init()

const BALL = table.physical.ballRadiusM
const mortuary = table.scoops.find((s) => s.id === 'mortuary')!
const inCrypt = (x: number, z: number) =>
  Math.abs(x - CRYPT.x) < CRYPT.half && z < CRYPT.bottom && z > CRYPT.top
for (const id of [CRYPT_ENTRY, CRYPT_HOME, CRYPT_DRAIN]) {
  const scoop = table.scoops.find((s) => s.id === id)!
  assert.ok(inCrypt(scoop.at[0], scoop.at[2]), `${id} is in the crypt`)
}
assert.ok(
  (table.occluders ?? []).some((o) => o.fadeFor === 'sub-table'),
  'the backbox hides the crypt from the main camera',
)
assert.ok(table.cameras.some((c) => c.id === 'sub-table'))

// The trip: a ball in the Mortuary sent down the subway comes up in the
// crypt; nobody flips, so it drains past the crypt's flippers and the
// subway brings it back up through the Mortuary's kicker.
{
  const physics = new PinballPhysics(RAPIER, table)
  try {
    physics.serveBall(
      [mortuary.at[0], mortuary.at[1] + 0.0005, mortuary.at[2] + 0.04],
      [0, 0, -0.2],
    )
    const seen: string[] = []
    let below = false
    let subway = false
    for (let s = 0; s < PHYSICS_HZ * 12; s++) {
      for (const e of physics.step()) {
        seen.push(`${e.type}:${'id' in e ? e.id : ''}`)
        if (e.type === 'capture' && e.id === 'mortuary' && !subway)
          subway = physics.subwayHeld('mortuary', CRYPT_ENTRY) === 1
      }
      const ball = physics.ballViews()[0]
      if (!ball) break
      if (!ball.captured && inCrypt(ball.position[0], ball.position[2])) {
        below = true
        assert.equal(ball.zone, 'sub-table')
        assert.equal(cameraViewFor(physics.ballViews()), 'sub-table')
      }
      if (seen.includes(`eject:mortuary`) && below) break
    }
    assert.ok(subway, 'the Mortuary sends its ball down the subway')
    assert.ok(below, 'and it comes up in the crypt')
    assert.ok(
      seen.includes(`capture:${CRYPT_DRAIN}`),
      'past the crypt flippers',
    )
    assert.ok(seen.includes('eject:mortuary'), 'back up through the Mortuary')
    assert.ok(!seen.includes('drain:'), 'never lost')
  } finally {
    physics.dispose()
  }
}

/** A ball fed down the crypt at `dx`, flipped `delay` steps after it lands. */
function cryptShot(side: 'left' | 'right', dx: number, delay: number) {
  const physics = new PinballPhysics(RAPIER, table)
  try {
    physics.serveBall([CRYPT.x + dx, BALL + 0.0005, -1.28], [0, 0, 0.2])
    const hits = new Set<string>()
    let left = ''
    let touched = -1
    for (let s = 0; s < PHYSICS_HZ * 4 && !left; s++) {
      const events = physics.step()
      if (
        touched < 0 &&
        events.some(
          (e) => e.type === 'contact' && e.id === `crypt-flipper-${side}`,
        )
      )
        touched = s
      if (touched >= 0 && s === touched + delay) physics.setFlipper(side, true)
      if (touched >= 0 && s === touched + delay + 40)
        physics.setFlipper(side, false)
      for (const e of events) {
        if (e.type === 'contact' && e.id.startsWith('crypt-skull'))
          hits.add(e.id)
        if (e.type === 'capture') left = e.id
        if (e.type === 'drain') left = 'drain'
      }
    }
    return { hits, left }
  } finally {
    physics.dispose()
  }
}

// Every skull and HOME from a crypt flipper (measured setups).
const PROOF: Array<[string, 'left' | 'right', number, number]> = [
  ['crypt-skull-1', 'left', -0.1, 8],
  ['crypt-skull-2', 'left', -0.1, 22],
  ['crypt-skull-3', 'left', -0.05, 24],
  [CRYPT_HOME, 'left', 0.1, 4],
]
assert.deepEqual(
  PROOF.slice(0, 3).map(([id]) => id),
  CRYPT_SKULLS.map((s) => s.id),
)
for (const [target, side, dx, delay] of PROOF) {
  const shot = cryptShot(side, dx, delay)
  const made =
    target === CRYPT_HOME ? shot.left === CRYPT_HOME : shot.hits.has(target)
  assert.ok(made, `${target} from the ${side} crypt flipper`)
  assert.notEqual(shot.left, 'drain')
}

// Nothing is stranded below: fed anywhere, flipped or not, every ball leaves
// the crypt by HOME or its drain, and none escapes its walls.
{
  let n = 0
  for (const dx of [-0.12, -0.06, 0, 0.06, 0.12]) {
    for (const vz of [0.05, 0.5]) {
      for (const flip of [false, true]) {
        const physics = new PinballPhysics(RAPIER, table)
        try {
          physics.serveBall([CRYPT.x + dx, BALL + 0.0005, -1.33], [0, 0, vz])
          let left = ''
          for (let s = 0; s < PHYSICS_HZ * 15 && !left; s++) {
            if (flip) {
              const up = s % 150 < 20
              physics.setFlipper('left', up)
              physics.setFlipper('right', up)
            }
            for (const e of physics.step()) {
              if (e.type === 'capture') left = e.id
              if (e.type === 'drain') left = 'drain'
            }
            const ball = physics.ballViews()[0]
            if (ball && !ball.captured)
              assert.ok(
                inCrypt(ball.position[0], ball.position[2]),
                'the ball stays in the crypt',
              )
          }
          assert.ok(
            left === CRYPT_HOME || left === CRYPT_DRAIN,
            `fed at ${dx} (${vz} m/s${flip ? ', flipping' : ''}): ${left || 'stuck'}`,
          )
          n++
        } finally {
          physics.dispose()
        }
      }
    }
  }
  console.log(`  ${n} crypt balls, every one home or back up the drain`)
}

/** The reducer by hand. */
class Game {
  state: ZuzuRulesState
  at = 0
  constructor() {
    this.state = rules.initial(3, 5)
    this.send({ type: 'start' })
  }
  send(event: RulesEvent) {
    const r = rules.step(this.state, event, { shots: table.shots })
    this.state = r.state
    return r.effects
  }
  sw(event: Record<string, unknown>) {
    return this.send({
      type: 'switch',
      event: { ballId: 1, ...event } as SwitchEvent,
      tick: ++this.at,
    })
  }
  relics(n: number) {
    for (let i = 0; i < n; i++)
      this.sw({ type: 'contact', id: RELIC, impulse: 1 })
  }
}
const subways = (out: RuleEffect[]) =>
  out.some(
    (e) =>
      e.type === 'mechanism' &&
      e.id === 'mortuary' &&
      e.action === 'subway' &&
      e.payload === CRYPT_ENTRY,
  )

// Three relic strikes light the crypt; the Mortuary takes the ball down
// instead of telling a chapter; skulls, HOME and the total.
{
  const g = new Game()
  g.relics(RELICS_FOR_CRYPT - 1)
  assert.equal(g.state.crypt.lit, false)
  g.relics(1)
  assert.equal(g.state.crypt.lit, true, 'the crypt stirs')
  assert.equal(rules.lamps(g.state, table).lamps['crypt-seal'], 'blink')
  assert.equal(rules.lamps(g.state, table).lamps['mortuary-arrow'], 'blink')
  const chapter = g.state.story.chapter
  let out = g.sw({ type: 'capture', id: 'mortuary' })
  assert.ok(subways(out), 'down the subway')
  assert.equal(g.state.crypt.inside, true)
  assert.equal(g.state.story.run, null, 'no chapter starts')
  assert.equal(g.state.story.chapter, chapter)
  assert.equal(rules.music(g.state), 'sub-table')
  const multiplier = g.state.bonusMultiplier
  for (const skull of CRYPT_SKULLS)
    g.sw({ type: 'contact', id: skull.id, impulse: 1 })
  assert.equal(g.state.bonusMultiplier, multiplier + 1, 'skulls broken')
  const before = g.state.score
  out = g.sw({ type: 'capture', id: CRYPT_HOME })
  assert.equal(g.state.score - before, VALUES.cryptHome)
  assert.equal(g.state.crypt.inside, false)
  assert.ok(
    out.some((e) => e.type === 'dmd' && e.scene === 'mode-total'),
    'the undercrypt total',
  )
  // Lit again by the next three strikes.
  g.relics(RELICS_FOR_CRYPT)
  assert.equal(g.state.crypt.lit, true)
  out = g.sw({ type: 'capture', id: 'mortuary' })
  assert.ok(subways(out))
  g.sw({ type: 'capture', id: CRYPT_DRAIN })
  assert.equal(g.state.crypt.inside, false, 'the drain lets you go')
  assert.equal(g.state.ball, 1, 'without costing the ball')
}

// Never during a multiball (no ball leaks below) or a chapter.
{
  const g = new Game()
  g.relics(RELICS_FOR_CRYPT)
  g.state = {
    ...g.state,
    ballsInPlay: 3,
    multiball: { ...g.state.multiball, kind: 'harvest' },
  }
  assert.ok(!subways(g.sw({ type: 'capture', id: 'mortuary' })))
  assert.equal(g.state.crypt.inside, false)
  assert.equal(g.state.crypt.lit, true, 'it waits for the multiball to end')

  const h = new Game()
  h.sw({ type: 'capture', id: 'mortuary' })
  assert.ok(h.state.story.run, 'a chapter is being told')
  h.relics(RELICS_FOR_CRYPT)
  assert.ok(!subways(h.sw({ type: 'capture', id: 'mortuary' })))
  assert.equal(h.state.crypt.inside, false)
}

assert.equal(livePhysicsWorlds(), 0)
console.log(
  'Undercrypt: subway down and back, crypt camera, every skull and HOME made, nothing stranded or lost, relics light it, never in a multiball or chapter, skulls, HOME and total verified',
)
