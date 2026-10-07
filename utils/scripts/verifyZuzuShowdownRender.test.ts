// /utils/scripts/verifyZuzuShowdownRender.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-006): the renderer's maths (life
// bars with red health, meter bars, the camera, the clock), the callouts it
// derives from sim events, and a headless run that draws every frame of a
// fuzzed match onto a recording stub canvas: nothing throws, nothing draws
// at a non-finite coordinate, and the HUD stays inside the screen.
//
//   npx tsx utils/scripts/verifyZuzuShowdownRender.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import {
  METER_BAR,
  STAGE_HALF_WIDTH,
  createMatch,
  step,
} from '../zuzuShowdown/sim'
import {
  VIEW_HEIGHT,
  VIEW_WIDTH,
  advanceCallouts,
  calloutsFor,
  cameraX,
  clockSeconds,
  drawCard,
  drawMatch,
  lifeBar,
  meterBars,
  screenX,
} from '../zuzuShowdown/render'
import {
  PLACEHOLDER_A,
  PLACEHOLDER_B,
} from '../zuzuShowdown/fighters/placeholders'
import {
  SIM_BUTTONS,
  SUB,
  neutralInput,
  type FighterData,
  type SimInput,
} from '../zuzuShowdown/types'

const ROSTER: [FighterData, FighterData] = [PLACEHOLDER_A, PLACEHOLDER_B]

let passed = 0
function check(name: string, fn: () => void): void {
  try {
    fn()
    passed += 1
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

type Call = { op: string; args: number[] }

/** A canvas context that records every draw call's numbers. */
function stubContext() {
  const calls: Call[] = []
  const record =
    (op: string) =>
    (...args: unknown[]) => {
      calls.push({
        op,
        args: args.filter((a): a is number => typeof a === 'number'),
      })
    }
  const gradient = { addColorStop: () => undefined }
  const g = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    fillRect: record('fillRect'),
    strokeRect: record('strokeRect'),
    save: record('save'),
    restore: record('restore'),
    createLinearGradient: () => gradient,
  }
  return { g: g as unknown as CanvasRenderingContext2D, calls }
}

check('life bars split health and red; they never overflow', () => {
  const s = createMatch(ROSTER)
  const f = s.fighters[1]
  assert.deepEqual(lifeBar(f, PLACEHOLDER_B, 190), { health: 190, red: 0 })
  f.health = 550
  f.red = 110
  assert.deepEqual(lifeBar(f, PLACEHOLDER_B, 190), { health: 95, red: 19 })
  f.health = 0
  f.red = 5000
  const empty = lifeBar(f, PLACEHOLDER_B, 190)
  assert.equal(empty.health, 0)
  assert.ok(empty.red <= 190)
})

check('meter bars count full bars and the bar in progress', () => {
  assert.deepEqual(meterBars(0), { full: 0, partial: 0 })
  assert.deepEqual(meterBars(METER_BAR / 2), { full: 0, partial: 0.5 })
  assert.deepEqual(meterBars(METER_BAR * 2 + 250), { full: 2, partial: 0.25 })
  assert.deepEqual(meterBars(METER_BAR * 3), { full: 3, partial: 0 })
})

check('the camera follows the midpoint and stops at the stage edges', () => {
  const s = createMatch(ROSTER)
  assert.equal(cameraX(s), 0)
  s.fighters[0].x = -STAGE_HALF_WIDTH * SUB
  s.fighters[1].x = -STAGE_HALF_WIDTH * SUB + 40 * SUB
  const camera = cameraX(s)
  assert.equal(camera, -(STAGE_HALF_WIDTH - VIEW_WIDTH / 2) * SUB)
  assert.equal(screenX(-STAGE_HALF_WIDTH * SUB, camera), 0)
})

check('the clock shows whole seconds, rounding up', () => {
  const s = createMatch(ROSTER)
  assert.equal(clockSeconds(s), 99)
  s.timer = 61
  assert.equal(clockSeconds(s), 2)
  s.timer = 0
  assert.equal(clockSeconds(s), 0)
})

check(
  'sim events become callouts; a new centre callout replaces the old',
  () => {
    const s = createMatch(ROSTER)
    const list = advanceCallouts([], s.events)
    assert.deepEqual(
      list.map((c) => c.text),
      ['ROUND 1'],
    )
    const next = advanceCallouts(list, [{ type: 'fight', round: 1 }])
    assert.deepEqual(
      next.map((c) => c.text),
      ['FIGHT!'],
    )
    const side = calloutsFor([
      { type: 'read', side: 1, kind: 'guard' },
      {
        type: 'hit',
        attacker: 0,
        move: 'stand_lp',
        damage: 36,
        combo: 1,
        counter: true,
      },
      { type: 'firstAttack', side: 0 },
      { type: 'ko', result: 'draw' },
      { type: 'matchOver', winner: 1 },
      { type: 'super', side: 0, move: 'showdown', showdown: true },
    ])
    assert.deepEqual(
      side.map((c) => [c.text, c.side]),
      [
        ['READ!', 1],
        ['COUNTER', 0],
        ['FIRST ATTACK', 0],
        ['DOUBLE K.O.', null],
        ['P2 WINS', null],
        ['SHOWDOWN!', 0],
      ],
    )
    // Callouts expire.
    let aged = advanceCallouts([], [{ type: 'read', side: 0, kind: 'strike' }])
    for (let i = 0; i < 200; i += 1) aged = advanceCallouts(aged, [])
    assert.equal(aged.length, 0)
  },
)

check(
  'a fuzzed match draws every frame at finite coordinates, HUD on screen',
  () => {
    for (const seed of [21, 22]) {
      const rand = mulberry32(seed)
      const held: [SimInput, SimInput] = [neutralInput(), neutralInput()]
      let s = createMatch(ROSTER)
      let callouts = advanceCallouts([], s.events)
      for (let i = 0; i < 3000 && s.phase !== 'over'; i += 1) {
        for (const p of held) {
          for (const button of SIM_BUTTONS)
            if (rand() < 0.1) p[button] = !p[button]
        }
        s = step(s, [{ ...held[0] }, { ...held[1] }], ROSTER)
        callouts = advanceCallouts(callouts, s.events)
        const { g, calls } = stubContext()
        drawMatch(g, s, ROSTER, callouts, {
          showBoxes: i % 2 === 0,
          reducedMotion: i % 3 === 0,
        })
        for (const call of calls) {
          for (const n of call.args)
            assert.ok(Number.isFinite(n), `${call.op} got ${n} on frame ${i}`)
        }
        assert.ok(calls.length > 20)
      }
    }
  },
)

check('the title card draws inside the screen', () => {
  const { g, calls } = stubContext()
  drawCard(g, [
    { text: 'ZUZU SHOWDOWN', scale: 3 },
    { text: 'PRESS START OR LP', scale: 2 },
  ])
  for (const call of calls.filter((c) => c.op === 'fillRect')) {
    const [x, y] = call.args
    assert.ok(
      x! >= 0 && x! <= VIEW_WIDTH && y! >= 0 && y! <= VIEW_HEIGHT,
      `${x},${y}`,
    )
  }
})

console.log(`verifyZuzuShowdownRender: ${passed} checks passed`)
