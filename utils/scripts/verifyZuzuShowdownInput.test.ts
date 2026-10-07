// /utils/scripts/verifyZuzuShowdownInput.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-004): two-player controls and the
// special-move reader. Every motion fighters.yaml uses, its timing windows
// and leniency, charge moves, rotations, the priority rules (supers beat
// specials, DP beats QCF, 360 beats HCB), side switching, Easy Specials, the
// notation parser, and the key maps / gamepad layout.
//
//   npx tsx utils/scripts/verifyZuzuShowdownInput.test.ts

import assert from 'node:assert/strict'
import { combineButtons } from '../arcade/input'
import {
  CHARGE_FRAMES,
  EASY_DAMAGE_PERCENT,
  HISTORY_FRAMES,
  LENIENCY,
  dirOf,
  emptyMotion,
  matches,
  parseNotation,
  pushDir,
  resolveCommand,
  type CommandSpec,
  type Dir,
  type Motion,
  type MotionState,
  type Pressed,
} from '../zuzuShowdown/motion'
import {
  FIGHT_BUTTONS,
  P1_KEYS,
  P2_KEYS,
  SOLO_KEYS,
  readFightPad,
  remapKey,
  toSimInput,
  type FightButton,
} from '../zuzuShowdown/input'
import { SIM_BUTTONS, neutralInput } from '../zuzuShowdown/types'

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

/** Feed directions (each held `each` frames), then `idle` frames of `rest`. */
function feed(dirs: Dir[], each = 2, after: Dir[] = []): MotionState {
  let m = emptyMotion()
  for (const dir of [5, 5, 5] as Dir[]) m = pushDir(m, dir)
  for (const dir of dirs) for (let i = 0; i < each; i += 1) m = pushDir(m, dir)
  for (const dir of after) m = pushDir(m, dir)
  return m
}

const repeat = (dir: Dir, frames: number): Dir[] =>
  Array.from({ length: frames }, () => dir)

const NONE: Pressed = {
  lp: false,
  hp: false,
  lk: false,
  hk: false,
  dodge: false,
  special: false,
}
const tap = (over: Partial<Pressed>): Pressed => ({ ...NONE, ...over })

// ---------------------------------------------------------------- directions

check('directions are numpad, relative to facing', () => {
  const d = (over: Partial<ReturnType<typeof neutralInput>>, facing: 1 | -1) =>
    dirOf({ ...neutralInput(), ...over }, facing)
  assert.equal(d({}, 1), 5)
  assert.equal(d({ right: true }, 1), 6)
  assert.equal(d({ right: true }, -1), 4)
  assert.equal(d({ left: true }, -1), 6)
  assert.equal(d({ up: true, right: true }, 1), 9)
  assert.equal(d({ down: true, left: true }, 1), 1)
  assert.equal(d({ down: true, left: true }, -1), 3)
  assert.equal(d({ up: true }, 1), 8)
  assert.equal(d({ down: true }, -1), 2)
  // Both horizontals cancel out.
  assert.equal(d({ left: true, right: true, down: true }, 1), 2)
})

check('the history keeps a bounded window', () => {
  let m = emptyMotion()
  for (let i = 0; i < HISTORY_FRAMES * 3; i += 1) m = pushDir(m, 5)
  assert.equal(m.dirs.length, HISTORY_FRAMES)
})

// ---------------------------------------------------------------- motions

const CANONICAL: Record<Motion, Dir[]> = {
  qcf: [2, 3, 6],
  qcb: [2, 1, 4],
  dp: [6, 2, 3],
  hcb: [6, 3, 2, 1, 4],
  '360': [6, 3, 2, 1, 4, 7, 8],
  '720': [6, 3, 2, 1, 4, 7, 8, 9, 6, 3, 2, 1, 4, 7, 8],
  qcf2: [2, 3, 6, 2, 3, 6],
  qcb2: [2, 1, 4, 2, 1, 4],
  chargeBF: [...repeat(4, CHARGE_FRAMES), 6],
  chargeDU: [...repeat(2, CHARGE_FRAMES), 8],
  dd: [2, 5, 2],
}

check('every motion matches its canonical input', () => {
  for (const [motion, dirs] of Object.entries(CANONICAL) as Array<
    [Motion, Dir[]]
  >) {
    const each = motion.startsWith('charge') ? 1 : 2
    assert.ok(
      matches(feed(dirs, each), motion),
      `${motion} should match ${dirs.join('')}`,
    )
  }
})

check('a plain stick wiggle completes nothing', () => {
  const m = feed([5, 6, 5, 4, 5, 6, 5], 2)
  for (const motion of Object.keys(CANONICAL) as Motion[]) {
    assert.ok(!matches(m, motion), `${motion} should not match`)
  }
})

check('the DP shortcut 3-2-3 counts', () => {
  assert.ok(matches(feed([3, 2, 3]), 'dp'))
})

check(
  'the button may come up to the leniency after the motion, not later',
  () => {
    assert.ok(matches(feed([2, 3, 6], 2, repeat(5, LENIENCY - 1)), 'qcf'))
    assert.ok(!matches(feed([2, 3, 6], 2, repeat(5, LENIENCY + 1)), 'qcf'))
    // Holding the last direction keeps it fresh.
    assert.ok(matches(feed([2, 3], 2, repeat(6, 9)), 'qcf'))
  },
)

check('a motion done too slowly does not count', () => {
  assert.ok(!matches(feed([2, 3, 6], 8), 'qcf'))
  assert.ok(matches(feed([2, 3, 6], 4), 'qcf'))
})

check('dd needs a release between the two downs', () => {
  assert.ok(!matches(feed([2], 6), 'dd'))
  assert.ok(matches(feed([2, 4, 1]), 'dd'))
})

check('charge needs the full hold, and the forward inside the leniency', () => {
  assert.ok(
    matches(feed([...repeat(1, CHARGE_FRAMES), 6], 1), 'chargeBF'),
    'down-back charges too',
  )
  assert.ok(!matches(feed([...repeat(4, CHARGE_FRAMES - 5), 6], 1), 'chargeBF'))
  assert.ok(
    !matches(
      feed([...repeat(4, CHARGE_FRAMES), ...repeat(5, LENIENCY + 2), 6], 1),
      'chargeBF',
    ),
  )
  assert.ok(
    matches(feed([...repeat(4, CHARGE_FRAMES), 5, 5, 6], 1), 'chargeBF'),
  )
  assert.ok(
    matches(feed([...repeat(3, CHARGE_FRAMES), 9], 1), 'chargeDU'),
    'down-forward charges down',
  )
  assert.ok(!matches(feed([...repeat(2, CHARGE_FRAMES), 6], 1), 'chargeDU'))
})

check('a 720 needs two full turns; one turn is only a 360', () => {
  const one = feed(CANONICAL['360'])
  assert.ok(matches(one, '360'))
  assert.ok(!matches(one, '720'))
  assert.ok(matches(feed(CANONICAL['720']), '720'))
  // Either rotation direction.
  assert.ok(matches(feed([4, 1, 2, 3, 6, 9, 8]), '360'))
  // Missing the up quarter is not a circle.
  assert.ok(!matches(feed([6, 3, 2, 1, 4, 1, 2]), '360'))
})

// ---------------------------------------------------------------- priority

const KIT: CommandSpec[] = [
  { id: 'fireball', motion: 'qcf', button: 'P', level: 'special' },
  { id: 'uppercut', motion: 'dp', button: 'P', level: 'special' },
  { id: 'parry', motion: 'qcb', button: 'K', level: 'special' },
  { id: 'grab', motion: '360', button: 'P', level: 'special' },
  { id: 'swing', motion: 'hcb', button: 'P', level: 'special' },
  { id: 'dive', motion: 'qcf', button: 'K', level: 'special', air: true },
  { id: 'super', motion: 'qcf2', button: 'P', level: 'super' },
  { id: 'showdown', motion: 'qcb2', button: 'HP', level: 'super' },
]

check('super beats special: QCF QCF + P is the super, not a fireball', () => {
  const r = resolveCommand(
    feed(CANONICAL.qcf2),
    tap({ lp: true }),
    NONE,
    KIT,
    false,
  )
  assert.deepEqual(r, { id: 'super', button: 'lp', easy: false })
})

check('DP beats QCF when one input completes both (6-2-3-6)', () => {
  const m = feed([6, 2, 3, 6])
  assert.ok(matches(m, 'qcf') && matches(m, 'dp'))
  assert.equal(
    resolveCommand(m, tap({ hp: true }), NONE, KIT, false)?.id,
    'uppercut',
  )
})

check('360 beats HCB', () => {
  const m = feed(CANONICAL['360'])
  assert.ok(matches(m, 'hcb') && matches(m, '360'))
  assert.equal(
    resolveCommand(m, tap({ lp: true }), NONE, KIT, false)?.id,
    'grab',
  )
})

check(
  'buttons and strengths: P vs K, heavy wins a double press, specific buttons',
  () => {
    const m = feed(CANONICAL.qcf)
    assert.equal(
      resolveCommand(m, tap({ lk: true }), NONE, KIT, false),
      null,
      'no ground QCF+K',
    )
    assert.deepEqual(
      resolveCommand(m, tap({ lp: true, hp: true }), NONE, KIT, false),
      {
        id: 'fireball',
        button: 'hp',
        easy: false,
      },
    )
    const qcb2 = feed(CANONICAL.qcb2)
    assert.equal(
      resolveCommand(qcb2, tap({ lp: true }), NONE, KIT, false),
      null,
      'the Showdown super is HP only',
    )
    assert.equal(
      resolveCommand(qcb2, tap({ hp: true }), NONE, KIT, false)?.id,
      'showdown',
    )
  },
)

check(
  'air commands only fire in the air, ground commands only on the ground',
  () => {
    const m = feed(CANONICAL.qcf)
    assert.equal(
      resolveCommand(m, tap({ hk: true }), NONE, KIT, true)?.id,
      'dive',
    )
    assert.equal(resolveCommand(m, tap({ hp: true }), NONE, KIT, true), null)
  },
)

check(
  'no button, no command; a press with no motion is a normal (null)',
  () => {
    assert.equal(
      resolveCommand(feed(CANONICAL.qcf), NONE, NONE, KIT, false),
      null,
    )
    assert.equal(
      resolveCommand(feed([5]), tap({ hp: true }), NONE, KIT, false),
      null,
    )
  },
)

// ---------------------------------------------------------------- side switch

check(
  'the same physical stick motion reads by facing (cross-ups flip it)',
  () => {
    // Down, down-right, right on the stick.
    const physical = [
      { down: true },
      { down: true, right: true },
      { right: true },
    ]
    const run = (facing: 1 | -1) => {
      let m = emptyMotion()
      for (const step of physical) {
        for (let i = 0; i < 2; i += 1)
          m = pushDir(m, dirOf({ ...neutralInput(), ...step }, facing))
      }
      return m
    }
    assert.ok(matches(run(1), 'qcf'))
    assert.ok(!matches(run(1), 'qcb'))
    assert.ok(matches(run(-1), 'qcb'))
    assert.ok(!matches(run(-1), 'qcf'))
  },
)

// ---------------------------------------------------------------- easy specials

const EASY = {
  neutral: 'fireball',
  forward: 'dash',
  back: 'parry',
  down: 'uppercut',
  super: 'super',
}

check(
  'Easy Specials: Special plus a direction, Special plus heavy for the super',
  () => {
    const at = (dir: Dir) => feed([dir])
    const fire = (dir: Dir, held: Partial<Pressed> = {}) =>
      resolveCommand(
        at(dir),
        tap({ special: true }),
        tap(held),
        KIT,
        false,
        EASY,
      )
    assert.deepEqual(fire(5), { id: 'fireball', button: null, easy: true })
    assert.equal(fire(6)?.id, 'dash')
    assert.equal(fire(4)?.id, 'parry')
    assert.equal(fire(1)?.id, 'uppercut')
    assert.equal(fire(3)?.id, 'uppercut')
    // An empty slot falls back to the neutral special.
    assert.equal(fire(8)?.id, 'fireball')
    assert.equal(fire(5, { hp: true })?.id, 'super')
    assert.equal(fire(6, { hk: true })?.id, 'super')
    // Without a table, Special does nothing.
    assert.equal(
      resolveCommand(at(5), tap({ special: true }), NONE, KIT, false),
      null,
    )
    assert.ok(EASY_DAMAGE_PERCENT > 0 && EASY_DAMAGE_PERCENT < 100)
  },
)

// ---------------------------------------------------------------- notation

check('every motion notation in fighters.yaml parses', () => {
  const cases: Array<[string, Motion, string, boolean]> = [
    ['QCF+P', 'qcf', 'P', false],
    ['QCB+K', 'qcb', 'K', false],
    ['DP+P', 'dp', 'P', false],
    ['DP+K', 'dp', 'K', false],
    ['HCB+K', 'hcb', 'K', false],
    ['HCB+P', 'hcb', 'P', false],
    ['360+P', '360', 'P', false],
    ['[b]f+P', 'chargeBF', 'P', false],
    ['[d]u+P', 'chargeDU', 'P', false],
    ['dd+K', 'dd', 'K', false],
    ['dd+P', 'dd', 'P', false],
    ['dd+D', 'dd', 'D', false],
    ['QCF QCF+P', 'qcf2', 'P', false],
    ['QCF QCF+K', 'qcf2', 'K', false],
    ['QCB QCB+HP', 'qcb2', 'HP', false],
    ['QCF+P in the air', 'qcf', 'P', true],
    ['QCF+K in the air', 'qcf', 'K', true],
    ['720+P (or QCF QCF+P with Easy Specials)', '720', 'P', false],
  ]
  for (const [text, motion, button, air] of cases) {
    assert.deepEqual(parseNotation(text), { motion, button, air }, text)
  }
  for (const text of [
    'any P while submerged',
    'QCF+P during Hook Lash hit',
    'LP+LK close',
    'P+K',
  ]) {
    assert.equal(parseNotation(text), null, text)
  }
})

// ---------------------------------------------------------------- controls

check('P1 and P2 keyboards share no key and both bind every button', () => {
  for (const map of [P1_KEYS, P2_KEYS, SOLO_KEYS]) {
    const bound = new Set(Object.values(map))
    for (const button of FIGHT_BUTTONS)
      assert.ok(bound.has(button), `${button} unbound`)
  }
  const shared = Object.keys(P1_KEYS).filter((code) => code in P2_KEYS)
  assert.deepEqual(shared, [])
})

check('remapping moves a key and releases the button’s old key', () => {
  const next = remapKey(P1_KEYS, 'lp', 'KeyK')
  assert.equal(next.KeyK, 'lp')
  assert.equal(next.KeyU, undefined, 'the old LP key is released')
  assert.ok(!Object.values(next).includes('hk'), 'HK lost its only key')
  assert.equal(P1_KEYS.KeyU, 'lp', 'the original map is untouched')
})

check('the gamepad uses the Street Fighter face layout', () => {
  const pad = (pressed: number[], axes = [0, 0]) => ({
    buttons: Array.from({ length: 17 }, (_, i) => ({
      pressed: pressed.includes(i),
    })) as unknown as Gamepad['buttons'],
    axes,
  })
  assert.deepEqual(readFightPad(pad([2])).lp, true)
  assert.deepEqual(readFightPad(pad([3])).hp, true)
  assert.deepEqual(readFightPad(pad([0])).lk, true)
  assert.deepEqual(readFightPad(pad([1])).hk, true)
  assert.equal(readFightPad(pad([4])).dodge, true)
  assert.equal(readFightPad(pad([7])).special, true)
  assert.equal(readFightPad(pad([9])).start, true)
  const stick = readFightPad(pad([], [-0.9, 0.9]))
  assert.equal(stick.left, true)
  assert.equal(stick.down, true)
  assert.equal(
    readFightPad(pad([], [0.2, -0.2])).up,
    false,
    'inside the deadzone',
  )
})

check(
  'a poll becomes a SimInput without Start, with press edges from the shared fold',
  () => {
    const first = combineButtons(FIGHT_BUTTONS, {}, [{ lp: true, start: true }])
    assert.equal(first.pressed.lp, true)
    const second = combineButtons(FIGHT_BUTTONS, first.held, [{ lp: true }])
    assert.equal(second.pressed.lp, false)
    const sim = toSimInput(first.held as Record<FightButton, boolean>)
    assert.deepEqual(Object.keys(sim).sort(), [...SIM_BUTTONS].sort())
    assert.equal(sim.lp, true)
  },
)

console.log(`verifyZuzuShowdownInput: ${passed} checks passed`)
