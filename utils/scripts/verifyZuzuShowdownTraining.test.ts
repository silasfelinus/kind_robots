// /utils/scripts/verifyZuzuShowdownTraining.test.ts
//
// Zuzu Showdown Training mode (conductor zuzu-showdown t-022):
//   - the match starts with no intro, and the dummy can be placed in the centre or either corner;
//   - each dummy setting does its job: it stands and gets hit, blocks every high, mid and low, blocks
//     only once it has been hit, or blocks at random (the same seed gives the same blocks);
//   - frame advantage comes out of the frame data: a jab is better on hit than on block;
//   - the input display logs directions relative to facing, how long each was held, and names the
//     special the motion parser read;
//   - meter and health refill, and the clock never runs out;
//   - the readouts draw on screen.
//
//   npx tsx utils/scripts/verifyZuzuShowdownTraining.test.ts

import assert from 'node:assert/strict'
import { specialFrames } from '../zuzuShowdown/cpu'
import { findFighter } from '../zuzuShowdown/fighters'
import { VIEW_HEIGHT, VIEW_WIDTH } from '../zuzuShowdown/render'
import {
  METER_MAX,
  ROUND_FRAMES,
  STAGE_HALF_WIDTH,
  step,
} from '../zuzuShowdown/sim'
import {
  advantageText,
  applyTrainingRules,
  canAct,
  drawTraining,
  dummyInput,
  logInput,
  newTraining,
  trackAdvantage,
  trainingMatch,
  type DummyMode,
  type TrainingState,
} from '../zuzuShowdown/training'
import {
  SUB,
  neutralInput,
  type FighterData,
  type MatchState,
  type SimEvent,
  type SimInput,
} from '../zuzuShowdown/types'

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

const ZUZU = findFighter('zuzu')
const COYOTE = findFighter('coyote-vagrant')
const ROSTER: [FighterData, FighterData] = [ZUZU, COYOTE]

type Button = 'lp' | 'hp' | 'lk' | 'hk'

/**
 * P1 walks in and throws `button` (crouching when `low`) each time it can act, `times` times; P2 is
 * the dummy. Returns every event and the training state at the end.
 */
function drill(
  mode: DummyMode,
  button: Button,
  options: { low?: boolean; times?: number; seed?: number } = {},
) {
  let s = trainingMatch(ROSTER)
  let t = newTraining(options.seed)
  const events: SimEvent[] = []
  let presses = 0
  let wait = 0
  const times = options.times ?? 6
  // Runs until the last press has played out (both fighters free again).
  for (let i = 0; i < 2400; i += 1) {
    if (wait > 0) wait -= 1
    else if (presses >= times) break
    const me = s.fighters[0]
    const gap = Math.abs(s.fighters[1].x - me.x) / SUB
    let input: SimInput = neutralInput()
    if (presses >= times) {
      // Done pressing: stand still while the last one recovers.
    } else if (gap > 36) input.right = true
    else if (wait === 0 && canAct(me) && canAct(s.fighters[1])) {
      input = neutralInput()
      if (options.low) input.down = true
      input[button] = true
      presses += 1
      wait = 30
    }
    const dummy = dummyInput(t, mode, s, 1, ROSTER)
    t = dummy.training
    s = step(s, [input, dummy.input], ROSTER)
    applyTrainingRules(s, ROSTER, {
      infiniteMeter: false,
      infiniteHealth: true,
    })
    t = trackAdvantage(t, s)
    events.push(...s.events)
  }
  const hits = events.filter((e) => e.type === 'hit' && e.attacker === 0)
  const blocks = events.filter((e) => e.type === 'block' && e.attacker === 0)
  return { s, t, hits: hits.length, blocks: blocks.length, events }
}

check(
  'training starts mid-fight; the dummy sits in the centre or either corner',
  () => {
    const centre = trainingMatch(ROSTER)
    assert.equal(centre.phase, 'fight')
    assert.equal(centre.events.length, 0, 'no round-start call')
    assert.ok(centre.fighters[0].x < 0 && centre.fighters[1].x > 0)
    for (const [place, side] of [
      ['p1-corner', 0],
      ['p2-corner', 1],
    ] as const) {
      let s = trainingMatch(ROSTER, place)
      s = step(s, [neutralInput(), neutralInput()], ROSTER)
      const wall = STAGE_HALF_WIDTH * SUB
      const f = s.fighters[side]
      assert.ok(Math.abs(f.x) <= wall, `${place}: on the stage`)
      assert.ok(Math.abs(f.x) > wall - 40 * SUB, `${place}: against the wall`)
      // The other fighter stands in front, facing in.
      assert.ok(
        Math.abs(s.fighters[1 - side]!.x) < Math.abs(f.x),
        `${place}: the other one is out of the corner`,
      )
    }
  },
)

check(
  'the dummy stands and gets hit, or blocks every high, mid and low',
  () => {
    const stand = drill('stand', 'lp')
    assert.ok(stand.hits >= 4, `a standing dummy is hit (${stand.hits})`)
    assert.equal(stand.blocks, 0)
    for (const [button, low] of [
      ['lp', false],
      ['hp', false],
      ['lk', true],
      ['hk', true],
    ] as const) {
      const block = drill('block', button, { low })
      assert.ok(
        block.blocks >= 4,
        `${button}${low ? ' low' : ''} blocked (${block.blocks})`,
      )
      assert.equal(
        block.hits,
        0,
        `${button}${low ? ' low' : ''} never lands on Block all`,
      )
    }
    const crouch = drill('crouch', 'lp')
    assert.ok(crouch.s.fighters[1].action === 'crouch' || crouch.hits > 0)
  },
)

check(
  'block after first hit takes the first hit and blocks what follows',
  () => {
    // Two quick jabs per approach: the first lands, the follow-up inside the guard window is blocked.
    let s = trainingMatch(ROSTER)
    let t = newTraining()
    const kinds: string[] = []
    let i = 0
    for (; i < 600; i += 1) {
      const me = s.fighters[0]
      const gap = Math.abs(s.fighters[1].x - me.x) / SUB
      const input = neutralInput()
      if (gap > 36) input.right = true
      else if (canAct(me) && kinds.length < 2) input.lp = true
      const dummy = dummyInput(t, 'block-after-hit', s, 1, ROSTER)
      t = dummy.training
      s = step(s, [input, dummy.input], ROSTER)
      for (const e of s.events)
        if ((e.type === 'hit' || e.type === 'block') && e.attacker === 0)
          kinds.push(e.type)
      if (kinds.length >= 2) break
    }
    assert.deepEqual(kinds, ['hit', 'block'])
  },
)

check(
  'random block mixes hits and blocks, the same way for the same seed',
  () => {
    const a = drill('random-block', 'hp', { times: 16, seed: 7 })
    const b = drill('random-block', 'hp', { times: 16, seed: 7 })
    assert.ok(a.hits > 0 && a.blocks > 0, `hits ${a.hits}, blocks ${a.blocks}`)
    assert.deepEqual(
      a.events.map((e) => e.type),
      b.events.map((e) => e.type),
    )
  },
)

check('frame advantage: a jab is better on hit than on block', () => {
  const onHit = drill('stand', 'lp', { times: 1 }).t.advantage
  const onBlock = drill('block', 'lp', { times: 1 }).t.advantage
  assert.ok(onHit && onBlock, 'both measured')
  assert.equal(onHit.on, 'hit')
  assert.equal(onBlock.on, 'block')
  assert.ok(
    onHit.frames > onBlock.frames,
    `${onHit.frames} vs ${onBlock.frames}`,
  )
  // The jab's frame data: hitstun 12 vs blockstun 9 shows as a 3-frame gap.
  const jab = ZUZU.moves.stand_lp
  assert.equal(onHit.frames - onBlock.frames, jab.hitstun - jab.blockstun)
  assert.ok(
    Math.abs(onBlock.frames) <= 8,
    `a jab is about even on block (${onBlock.frames})`,
  )
  assert.match(advantageText({ frames: 3, on: 'block' }), /^\+3 ON BLOCK$/)
  assert.match(advantageText({ frames: -2, on: 'hit' }), /^-2 ON HIT$/)
})

check(
  'the input display logs directions by facing and names the special it read',
  () => {
    // Facing left (P2's side), holding left is forward.
    let log = logInput([], { ...neutralInput(), left: true }, -1, [])
    log = logInput(log, { ...neutralInput(), left: true }, -1, [])
    assert.equal(log.length, 1)
    assert.equal(log[0]!.dir, 6)
    assert.equal(log[0]!.frames, 2)
    log = logInput(
      log,
      { ...neutralInput(), down: true, right: true, lp: true },
      -1,
      [],
    )
    assert.equal(log[1]!.dir, 1)
    assert.deepEqual(log[1]!.buttons, ['LP'])

    // The real thing: Zuzu's quarter-circle punch is read as Iai Flash.
    let s = trainingMatch(ROSTER)
    let entries: TrainingState['inputs'] = []
    const iai = ZUZU.specials.find((sp) => sp.id === 'iai-flash')!
    const frames = specialFrames(iai, 1)!
    for (const input of [...frames, neutralInput(), neutralInput()]) {
      s = step(s, [input, neutralInput()], ROSTER)
      entries = logInput(entries, input, s.fighters[0].facing, s.events)
    }
    const read = entries.find((e) => e.read)
    assert.ok(read, 'the special is named')
    assert.equal(read.read, 'Iai Flash')
    assert.deepEqual(
      entries.map((e) => e.dir).slice(0, 3),
      [2, 3, 6],
      'the motion shows as down, down-forward, forward',
    )
  },
)

check('meter and health refill and the clock stands still', () => {
  const s: MatchState = trainingMatch(ROSTER)
  s.fighters[0].meter = 0
  s.fighters[1].health = 10
  s.fighters[1].red = 50
  s.timer = 5
  applyTrainingRules(s, ROSTER, { infiniteMeter: true, infiniteHealth: true })
  assert.equal(s.fighters[0].meter, METER_MAX)
  assert.equal(s.fighters[1].health, COYOTE.health)
  assert.equal(s.fighters[1].red, 0)
  assert.equal(s.timer, ROUND_FRAMES)
  // Off: nothing refills.
  const off = trainingMatch(ROSTER)
  off.fighters[1].health = 10
  applyTrainingRules(off, ROSTER, {
    infiniteMeter: false,
    infiniteHealth: false,
  })
  assert.equal(off.fighters[1].health, 10)
  assert.equal(off.fighters[0].meter, 0)
  // Mid-combo the health waits: a fighter in hitstun isn't refilled.
  const mid = trainingMatch(ROSTER)
  mid.fighters[1].health = 10
  mid.fighters[1].action = 'hitstun'
  applyTrainingRules(mid, ROSTER, {
    infiniteMeter: false,
    infiniteHealth: true,
  })
  assert.equal(mid.fighters[1].health, 10)
})

check('the readouts draw on screen', () => {
  const calls: Array<{ op: string; args: number[] }> = []
  const record =
    (op: string) =>
    (...args: unknown[]) =>
      calls.push({
        op,
        args: args.filter((a): a is number => typeof a === 'number'),
      })
  const g = {
    fillStyle: '',
    fillRect: record('fillRect'),
  } as unknown as CanvasRenderingContext2D
  const t = drill('block', 'lp', { times: 3 }).t
  let log = t.inputs
  for (let i = 0; i < 20; i += 1)
    log = logInput(
      log,
      { ...neutralInput(), right: i % 2 === 0, hp: i % 3 === 0 },
      1,
      [{ type: 'special', side: 0, move: 'thousand-mile-step', easy: false }],
    )
  drawTraining(g, { ...t, inputs: log }, VIEW_WIDTH)
  assert.ok(calls.length > 50)
  for (const { args } of calls) {
    const [x, y, w, h] = args as [number, number, number, number]
    assert.ok(
      x >= 0 && y >= 0 && x + w <= VIEW_WIDTH && y + h <= VIEW_HEIGHT,
      `fillRect ${args}`,
    )
  }
})

console.log(`verifyZuzuShowdownTraining: ${passed} checks passed`)
