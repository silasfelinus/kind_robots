// The Abbey upper deck (conductor zuzu-pinball/t-006): a clear raised deck
// at the Bell spiral's end with two small upper flippers, three hollow-bell
// standups and a protected exit. A made spiral shot lands on the deck (it
// used to fly off the cabinet); the upper flippers flip with the lower ones,
// or alone while B is held; each bell is reachable from an upper flipper; a
// ball on the deck always leaves by the exit hole and the subway to the right
// inlane, never by falling; and the bells' rules toll and open the Mortuary.
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { PHYSICS_HZ } from '../arcade/pinball/clock'
import {
  livePhysicsWorlds,
  PinballPhysics,
} from '../arcade/pinball/physics/world'
import type { RulesEvent } from '../arcade/pinball/rules/engine'
import {
  ABBEY_BELL_COUNT,
  ABBEY_EXIT,
  VALUES,
  ZUZU_RULESET as rules,
  type ZuzuRulesState,
} from '../arcade/pinball/tables/zuzuLastBell/rules'
import {
  ABBEY_BELLS,
  DECK,
  DECK_Y,
  INLANE_GUIDE,
  SLING_BACK,
  ZUZU_LAST_BELL_GREYBOX as table,
} from '../arcade/pinball/tables/zuzuLastBell/table'
import { AIM_HOLD_TICKS, cradle } from '../arcade/pinball/tuning/aim'
import type { SwitchEvent, Vec3 } from '../arcade/pinball/types'

await RAPIER.init()

const BALL = table.physical.ballRadiusM
const STEPS_PER_TICK = PHYSICS_HZ / 60
const upper = table.flippers.filter((f) => f.upper)
assert.equal(upper.length, 2, 'two upper flippers')
assert.ok(
  upper.every((f) => f.pivot[1] === DECK_Y),
  'on the raised deck',
)
assert.ok(DECK_Y > 0.15, 'physically elevated above the playfield')
const exit = table.scoops.find((s) => s.id === ABBEY_EXIT)!
const inlaneRight = (x: number) => x < INLANE_GUIDE.right && x > SLING_BACK
assert.ok(
  inlaneRight(exit.eject.at[0]),
  'the exit subway feeds the right inlane',
)

// A made Bell spiral, from the real left flipper, lands on the deck and
// leaves by the exit; it never leaves the cabinet.
{
  const physics = new PinballPhysics(RAPIER, table)
  try {
    cradle(physics, 'left')
    physics.setFlipper('left', false)
    const delay = 42
    const seen: string[] = []
    let onDeck = false
    let maxX = 0
    for (let t = 0; t < delay + 60 * 6; t++) {
      if (t === delay) physics.setFlipper('left', true, 'lower')
      if (t === delay + AIM_HOLD_TICKS)
        physics.setFlipper('left', false, 'lower')
      for (let k = 0; k < STEPS_PER_TICK; k++)
        for (const e of physics.step())
          if (t >= delay && e.type !== 'contact' && e.type !== 'sensor-exit')
            seen.push(`${e.type}:${'id' in e ? e.id : ''}`)
      const ball = physics.ballViews()[0]
      if (!ball) break
      const [x, y, z] = ball.position
      maxX = Math.max(maxX, x)
      if (
        Math.abs(y - (DECK_Y + BALL)) < 0.005 &&
        x > DECK.left &&
        x < DECK.right &&
        z > DECK.top &&
        z < DECK.front
      )
        onDeck = true
      if (seen.includes(`eject:${ABBEY_EXIT}`)) break
    }
    assert.ok(seen.includes('sensor-enter:bell-return'), 'the spiral is made')
    assert.ok(onDeck, 'and its ball rolls out onto the Abbey deck')
    assert.ok(maxX < 0.3, `never past the cabinet's side (max x ${maxX})`)
    assert.ok(
      seen.includes(`capture:${ABBEY_EXIT}`) &&
        seen.includes(`eject:${ABBEY_EXIT}`),
      'and it comes home through the exit',
    )
    assert.ok(!seen.includes('drain:'), 'without a drain')
  } finally {
    physics.dispose()
  }
}

// The upper flippers: the same buttons, or alone (the B-held tier).
{
  const physics = new PinballPhysics(RAPIER, table)
  try {
    assert.ok(physics.hasUpperFlippers)
    const raised = () => {
      const angles = physics.flipperAngles()
      return table.flippers
        .filter((f) => Math.abs(angles[f.id]! - f.activeAngle) < 0.05)
        .map((f) => f.id)
        .sort()
    }
    const settle = () => {
      for (let i = 0; i < 30; i++) physics.step()
    }
    physics.setFlipper('left', true)
    settle()
    assert.deepEqual(raised(), [
      'abbey-flipper-left',
      'crypt-flipper-left',
      'zuzu-lower-left',
    ])
    physics.setFlipper('left', false)
    physics.setFlipper('right', true, 'upper')
    settle()
    assert.deepEqual(raised(), ['abbey-flipper-right'], 'upper alone')
    physics.setFlipper('right', false, 'upper')
    physics.setFlipper('right', true, 'lower')
    settle()
    assert.deepEqual(
      raised(),
      ['crypt-flipper-right', 'zuzu-lower-right'],
      'lower alone (the crypt pair is on the lower buttons)',
    )
  } finally {
    physics.dispose()
  }
}

/**
 * A ball fed down the deck at `x`, flipped by one upper flipper `delay`
 * steps after it first touches it: the bells it rings and how it leaves.
 */
function deckShot(side: 'left' | 'right', x: number, delay: number) {
  const physics = new PinballPhysics(RAPIER, table)
  try {
    physics.serveBall([x, DECK_Y + BALL + 0.001, -0.6], [0, 0, 0.05])
    const bells = new Set<string>()
    let left = ''
    let touched = -1
    for (let s = 0; s < PHYSICS_HZ * 4 && !left; s++) {
      const events = physics.step()
      if (
        touched < 0 &&
        events.some(
          (e) => e.type === 'contact' && e.id === `abbey-flipper-${side}`,
        )
      )
        touched = s
      if (touched >= 0 && s === touched + delay)
        physics.setFlipper(side, true, 'upper')
      if (touched >= 0 && s === touched + delay + 40)
        physics.setFlipper(side, false, 'upper')
      for (const e of events) {
        if (e.type === 'contact' && e.id.startsWith('abbey-bell'))
          bells.add(e.id)
        if (e.type === 'capture') left = e.id
        if (e.type === 'drain') left = 'drain'
      }
    }
    return { bells, left }
  } finally {
    physics.dispose()
  }
}

// Every hollow bell is reachable from an upper flipper (measured setups).
const PROOF: Array<[string, 'left' | 'right', number, number]> = [
  ['abbey-bell-1', 'right', 0.22, 0],
  ['abbey-bell-2', 'right', 0.22, 4],
  ['abbey-bell-3', 'left', 0.125, 0],
]
assert.deepEqual(
  PROOF.map(([bell]) => bell),
  ABBEY_BELLS.map((b) => b.id),
)
for (const [bell, side, x, delay] of PROOF) {
  const shot = deckShot(side, x, delay)
  assert.ok(shot.bells.has(bell), `${bell} from the ${side} upper flipper`)
  assert.notEqual(shot.left, 'drain')
}

// Nothing is stranded on the deck and nothing falls off it: fed anywhere,
// flipped or not, every ball leaves by the exit hole.
{
  let n = 0
  for (const x of [0.13, 0.16, 0.2, 0.235, 0.27]) {
    for (const vz of [0.02, 0.3, 0.8]) {
      for (const flip of [false, true]) {
        const physics = new PinballPhysics(RAPIER, table)
        try {
          physics.serveBall([x, DECK_Y + BALL + 0.001, -0.62], [0, 0, vz])
          let left = ''
          for (let s = 0; s < PHYSICS_HZ * 12 && !left; s++) {
            if (flip) {
              const up = s % 120 < 20
              physics.setFlipper('left', up, 'upper')
              physics.setFlipper('right', up, 'upper')
            }
            for (const e of physics.step()) {
              if (e.type === 'capture') left = e.id
              if (e.type === 'drain') left = 'drain'
            }
            const ball = physics.ballViews()[0]
            if (ball && !ball.captured && ball.position[1] < DECK_Y - 0.02)
              left = 'fell'
          }
          assert.equal(
            left,
            ABBEY_EXIT,
            `fed at ${x} (${vz} m/s${flip ? ', flipping' : ''}): ${left || 'stuck'}`,
          )
          n++
        } finally {
          physics.dispose()
        }
      }
    }
  }
  console.log(`  ${n} deck balls, every one home through the exit`)
}

// A ball on the playfield beneath the deck is never taken by its exit.
{
  const physics = new PinballPhysics(RAPIER, table)
  try {
    const below: Vec3 = [exit.at[0], BALL + 0.0005, exit.at[2]]
    physics.serveBall(below, [0, 0, 0.1])
    for (let s = 0; s < PHYSICS_HZ; s++)
      for (const e of physics.step())
        assert.ok(
          !(e.type === 'capture' && e.id === ABBEY_EXIT),
          'the exit is on the deck only',
        )
  } finally {
    physics.dispose()
  }
}

// The rules: each bell rings; all three toll and open the Mortuary.
{
  let state: ZuzuRulesState = rules.initial(3, 1)
  let at = 0
  const send = (event: RulesEvent) => {
    const r = rules.step(state, event, { shots: table.shots })
    state = r.state
    return r.effects
  }
  const sw = (event: Record<string, unknown>) =>
    send({
      type: 'switch',
      event: { ballId: 1, ...event } as SwitchEvent,
      tick: ++at,
    })
  send({ type: 'start' })
  // The Mortuary closed, a chapter not running.
  state = { ...state, story: { ...state.story, mortuaryLit: false } }
  const before = state.score
  for (const bell of ABBEY_BELLS.slice(0, 2)) {
    sw({ type: 'contact', id: bell.id, impulse: 1 })
    sw({ type: 'contact', id: bell.id, impulse: 1 })
  }
  assert.equal(state.abbey.bells.length, 2, 'a bell twice counts once')
  assert.equal(state.story.mortuaryLit, false)
  const out = sw({ type: 'contact', id: ABBEY_BELLS[2]!.id, impulse: 1 })
  assert.equal(state.abbey.tolls, 1, 'the bells toll')
  assert.equal(state.abbey.bells.length, 0, 'and start again')
  assert.equal(state.story.mortuaryLit, true, 'the Mortuary opens')
  assert.equal(
    state.score - before,
    VALUES.abbeyBell * (2 * 2 + 1) + VALUES.abbeyToll,
  )
  assert.ok(out.some((e) => e.type === 'dmd' && e.text === 'THE BELLS TOLL'))
  assert.equal(ABBEY_BELL_COUNT, ABBEY_BELLS.length)
}

assert.equal(livePhysicsWorlds(), 0)
console.log(
  'Abbey deck: spiral to the deck, upper flippers (with and without the lower pair), every bell reachable, nothing stranded or fallen, exit subway and bell rules verified',
)
